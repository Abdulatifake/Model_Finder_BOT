import fs from 'fs';
import path from 'path';
import { prisma } from '../src/database/connection.js';
import { readExport, groupPosts, dedupe } from '../src/services/exportReader.js';
import { saveModelThumbnail, MODEL_IMAGE_PREFIX } from '../src/services/imageService.js';
import { getImageEmbedding } from '../src/services/embeddingService.js';
import { buildModelRow } from '../src/services/ingestService.js';
import { upsertModels } from '../src/models/Model3D.js';
import { config } from '../src/config/default.js';
import { DEMO_IMAGE_URLS } from '../src/config/demoModels.js';

const BATCH_SIZE = 32;
const EXPORT_DIR = process.env.EXPORT_DIR;
// Sinov uchun: npm run import -- --limit 1000
const limitIndex = process.argv.indexOf('--limit');
const LIMIT = limitIndex > -1 ? Number(process.argv[limitIndex + 1]) : Infinity;

function formatDuration(ms) {
  const minutes = Math.round(ms / 60000);
  return minutes >= 60 ? `${Math.floor(minutes / 60)} soat ${minutes % 60} daq` : `${minutes} daq`;
}

async function main() {
  if (!EXPORT_DIR) {
    console.error("backend/.env faylida EXPORT_DIR ko'rsatilmagan (Telegram eksport papkasi manzili).");
    process.exit(1);
  }
  const resultPath = path.join(EXPORT_DIR, 'result.json');
  if (!fs.existsSync(resultPath)) {
    console.error(`result.json topilmadi: ${resultPath}`);
    process.exit(1);
  }

  const { data, partial } = readExport(resultPath);
  if (partial) {
    console.log("⚠️  Eksport hali tugamagan — hozircha tayyor qismi import qilinadi. Tugagach skriptni yana ishga tushiring.");
  }

  const { posts, unlinkedFiles } = groupPosts(data.messages);
  // Avval faylsizlar chiqariladi: aks holda faylsiz qayta joylanish fayli bor asl nusxani "yutib" yuboradi
  const usable = dedupe(posts.filter((p) => p.files.length || p.meta.sourceLink));
  console.log(
    `Postlar: ${posts.length} | faylli va takrorlanmagan: ${usable.length} | bog'lanmagan fayllar: ${unlinkedFiles}`
  );

  const removedDemo = await prisma.model3D.deleteMany({ where: { previewImageUrl: { in: DEMO_IMAGE_URLS } } });
  if (removedDemo.count) console.log(`Namunaviy modellar o'chirildi: ${removedDemo.count}`);

  const existing = new Map(
    (
      await prisma.model3D.findMany({
        where: { telegramMessageId: { not: null } },
        select: { id: true, telegramMessageId: true, fileMessageIds: true },
      })
    ).map((r) => [r.telegramMessageId.toString(), r])
  );

  // Oldingi importda fayli (yoki arxivning barcha qismlari) hali bog'lanmagan modellarni to'ldirish
  let filesLinked = 0;
  for (const post of usable) {
    const row = existing.get(String(post.messageId));
    if (row && post.files.length > row.fileMessageIds.length) {
      await prisma.model3D.update({
        where: { id: row.id },
        data: {
          fileMessageIds: post.files.map((f) => BigInt(f.id)),
          fileNames: post.files.map((f) => f.name),
          fileSize: BigInt(post.files.reduce((sum, f) => sum + (f.size || 0), 0)),
        },
      });
      filesLinked++;
    }
  }
  if (filesLinked) console.log(`Mavjud modellarga fayl bog'landi: ${filesLinked}`);

  const todo = usable.filter((p) => !existing.has(String(p.messageId))).slice(0, LIMIT);
  console.log(`Bazada bor: ${existing.size} | yangi import qilinadi: ${todo.length}\n`);

  let batch = [];
  let done = 0;
  let failed = 0;
  const started = Date.now();
  let lastLog = 0;

  async function flush() {
    if (!batch.length) return;
    await upsertModels(batch);
    done += batch.length;
    batch = [];
    if (Date.now() - lastLog < 15_000 && done < todo.length) return;
    lastLog = Date.now();
    const elapsed = Date.now() - started;
    const perSecond = done / (elapsed / 1000);
    const eta = ((todo.length - done - failed) / perSecond) * 1000;
    const percent = ((done / todo.length) * 100).toFixed(1);
    console.log(
      `${done.toLocaleString('ru')} / ${todo.length.toLocaleString('ru')} (${percent}%) · ${perSecond.toFixed(1)} model/s · qoldi ≈ ${formatDuration(eta)}${failed ? ` · xato: ${failed}` : ''}`
    );
  }

  for (const post of todo) {
    try {
      const fileName = `${post.messageId}.jpg`;
      const thumbPath = path.join(config.paths.models, fileName);
      // Oldingi to'xtatilgan importdan qolgan kichik rasm bo'lsa, qayta yaratilmaydi
      if (!fs.existsSync(thumbPath)) await saveModelThumbnail(path.join(EXPORT_DIR, post.photo), fileName);

      const embedding = await getImageEmbedding(thumbPath);
      batch.push(
        buildModelRow({
          messageId: post.messageId,
          meta: post.meta,
          previewImageUrl: `${MODEL_IMAGE_PREFIX}${fileName}`,
          files: post.files,
          embedding,
        })
      );
    } catch (err) {
      failed++;
      console.error(`Post #${post.messageId} o'tkazib yuborildi: ${err.message}`);
    }
    if (batch.length >= BATCH_SIZE) await flush();
  }
  await flush();

  console.log(`\n✅ Tugadi! Yangi: ${done} · xato: ${failed} · vaqt: ${formatDuration(Date.now() - started)}`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
