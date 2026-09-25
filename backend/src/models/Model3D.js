import { Prisma } from '@prisma/client';
import { prisma } from '../database/connection.js';
import { normalizeExternalId, multipartBase } from '../services/captionParser.js';

const COLUMNS = Prisma.sql`id, name, description, category, tags, "previewImageUrl", "sourceLink", "telegramLink",
  "fileMessageIds", "fileNames", "fileSize", "photoFileId"`;

export const MODEL_SELECT = {
  id: true,
  name: true,
  description: true,
  category: true,
  tags: true,
  previewImageUrl: true,
  sourceLink: true,
  telegramLink: true,
  fileMessageIds: true,
  fileNames: true,
  fileSize: true,
  photoFileId: true,
};

export function toVectorLiteral(vector) {
  return `[${Array.from(vector, (v) => v.toFixed(5)).join(',')}]`;
}

function escapeLike(value) {
  return value.replace(/[\\%_]/g, '\\$&');
}

export async function findNearest(vector, { limit = 20 } = {}) {
  const v = toVectorLiteral(vector);
  return prisma.$queryRaw`
    SELECT ${COLUMNS}, 1 - (embedding <=> ${v}::halfvec) AS similarity
    FROM "Model3D"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${v}::halfvec
    LIMIT ${limit}`;
}

export async function findSimilarTo(modelId, { limit = 20 } = {}) {
  return prisma.$queryRaw`
    WITH src AS (SELECT embedding AS e FROM "Model3D" WHERE id = ${modelId})
    SELECT ${COLUMNS}, 1 - (embedding <=> (SELECT e FROM src)) AS similarity
    FROM "Model3D"
    WHERE embedding IS NOT NULL AND id <> ${modelId}
    ORDER BY embedding <=> (SELECT e FROM src)
    LIMIT ${limit}`;
}

// Gibrid qidiruv: ma'no bo'yicha o'xshashlik + nom/teglarda so'z uchrashi uchun bonus (brend nomlari uchun muhim)
export async function findByText(vector, words, { category, limit = 20, offset = 0 } = {}) {
  const v = toVectorLiteral(vector);
  const hits = words.length
    ? Prisma.join(
        words.map((word) => {
          const pattern = `%${escapeLike(word)}%`;
          return Prisma.sql`(CASE WHEN name ILIKE ${pattern} OR array_to_string(tags, ' ') ILIKE ${pattern} THEN 1 ELSE 0 END)`;
        }),
        ' + '
      )
    : Prisma.sql`0`;

  return prisma.$queryRaw`
    SELECT ${COLUMNS}, similarity FROM (
      SELECT ${COLUMNS}, 1 - (embedding <=> ${v}::halfvec) AS similarity, ${hits} AS hits
      FROM "Model3D"
      WHERE embedding IS NOT NULL ${category ? Prisma.sql`AND category = ${category}` : Prisma.empty}
    ) ranked
    ORDER BY similarity + 0.05 * hits DESC
    LIMIT ${limit} OFFSET ${offset}`;
}

export function listByCategory({ category, limit = 20, offset = 0 } = {}) {
  return prisma.model3D.findMany({
    where: category ? { category } : {},
    orderBy: { id: 'desc' },
    skip: offset,
    take: limit,
    select: MODEL_SELECT,
  });
}

export async function getModelsByIds(ids) {
  if (!ids.length) return [];
  const rows = await prisma.model3D.findMany({ where: { id: { in: ids } }, select: MODEL_SELECT });
  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.map((id) => byId.get(id)).filter(Boolean);
}

export async function categoryCounts() {
  const rows = await prisma.model3D.groupBy({ by: ['category'], _count: { _all: true } });
  return Object.fromEntries(rows.map((r) => [r.category, r._count._all]));
}

export function countModels() {
  return prisma.model3D.count();
}

export function setPhotoFileId(id, photoFileId) {
  return prisma.model3D.update({ where: { id }, data: { photoFileId } });
}

// Bir nechta modelni bitta so'rov bilan yozadi. Qayta import qilinganda mavjud fayl havolalari yo'qolmaydi.
export function upsertModels(rows) {
  const values = rows.map(
    (r) => Prisma.sql`(
      ${r.telegramMessageId}, ${r.externalId}, ${r.name}, ${r.category}, ${r.tags}::text[], ${r.previewImageUrl},
      ${r.telegramLink}, ${r.sourceLink}, ${r.fileMessageIds}::bigint[], ${r.fileNames}::text[], ${r.fileSize}::bigint,
      ${toVectorLiteral(r.embedding)}::halfvec, now()
    )`
  );

  return prisma.$executeRaw`
    INSERT INTO "Model3D" (
      "telegramMessageId", "externalId", "name", "category", "tags", "previewImageUrl",
      "telegramLink", "sourceLink", "fileMessageIds", "fileNames", "fileSize", "embedding", "updatedAt"
    )
    VALUES ${Prisma.join(values)}
    ON CONFLICT ("telegramMessageId") DO UPDATE SET
      "externalId" = EXCLUDED."externalId",
      "name" = EXCLUDED."name",
      "category" = EXCLUDED."category",
      "tags" = EXCLUDED."tags",
      "previewImageUrl" = EXCLUDED."previewImageUrl",
      "telegramLink" = EXCLUDED."telegramLink",
      "sourceLink" = EXCLUDED."sourceLink",
      "fileMessageIds" = CASE WHEN cardinality(EXCLUDED."fileMessageIds") > 0
        THEN EXCLUDED."fileMessageIds" ELSE "Model3D"."fileMessageIds" END,
      "fileNames" = CASE WHEN cardinality(EXCLUDED."fileNames") > 0
        THEN EXCLUDED."fileNames" ELSE "Model3D"."fileNames" END,
      "fileSize" = COALESCE(EXCLUDED."fileSize", "Model3D"."fileSize"),
      "embedding" = EXCLUDED."embedding",
      "photoFileId" = NULL,
      "updatedAt" = now()`;
}

export async function channelModelExists(messageId) {
  const row = await prisma.model3D.findUnique({ where: { telegramMessageId: BigInt(messageId) }, select: { id: true } });
  return Boolean(row);
}

// Kanal bir modelni qayta joylasa, eng yangi (fayli bor) post qoladi; eskilari o'chiriladi,
// ularni saqlagan foydalanuvchilarning "Saqlangan"lari yangisiga ko'chiriladi.
async function removeOlderDuplicates(externalId) {
  const copies = await prisma.model3D.findMany({
    where: { externalId, telegramMessageId: { not: null }, NOT: { fileMessageIds: { isEmpty: true } } },
    orderBy: { telegramMessageId: 'desc' },
    select: { id: true },
  });
  if (copies.length < 2) return;

  const [keep, ...old] = copies.map((c) => c.id);
  await prisma.$executeRaw`
    UPDATE "Favorite" f SET "modelId" = ${keep}
    WHERE f."modelId" IN (${Prisma.join(old)})
      AND NOT EXISTS (SELECT 1 FROM "Favorite" k WHERE k."userId" = f."userId" AND k."modelId" = ${keep})`;
  await prisma.model3D.deleteMany({ where: { id: { in: old } } });
}

// Kanalga rasm postidan keyin kelgan fayl postini tegishli modelga bog'laydi
export async function attachFile({ messageId, fileName, fileSize }) {
  const externalId = normalizeExternalId(fileName);
  const base = multipartBase(fileName);

  // 1) Odatiy holat: fayl o'zidan oldingi (hali faylsiz) rasm postidan darhol keyin keladi
  let target = await prisma.model3D.findFirst({
    where: {
      telegramMessageId: { gte: BigInt(messageId - 3), lt: BigInt(messageId) },
      fileMessageIds: { isEmpty: true },
    },
    orderBy: { telegramMessageId: 'desc' },
    select: { id: true },
  });

  if (!target && base) {
    // 2) Arxivning keyingi qismi — oldingi qismlari bog'langan modelga qo'shiladi
    const rows = await prisma.$queryRaw`
      SELECT id FROM "Model3D"
      WHERE "telegramMessageId" BETWEEN ${BigInt(messageId - 300)} AND ${BigInt(messageId - 1)}
        AND EXISTS (SELECT 1 FROM unnest("fileNames") AS f WHERE lower(f) LIKE ${`${escapeLike(base)}.%`})
      ORDER BY "telegramMessageId" DESC
      LIMIT 1`;
    // Birinchi qism (masalan, rasm -> PDF katalog -> part1) — eng yaqin rasm postiga
    target =
      rows[0] ??
      (await prisma.model3D.findFirst({
        where: { telegramMessageId: { gte: BigInt(messageId - 5), lt: BigInt(messageId) } },
        orderBy: { telegramMessageId: 'desc' },
        select: { id: true },
      }));
  }

  if (!target && externalId) {
    // 3) Fayl alohida kelgan: fayl nomidagi 3dsky ID bo'yicha (fayli bor modelga ikkinchi nusxa qo'shilmaydi)
    target = await prisma.model3D.findFirst({
      where: { externalId, fileMessageIds: { isEmpty: true } },
      orderBy: { telegramMessageId: 'desc' },
      select: { id: true },
    });
  }
  if (!target) return null;

  const id = BigInt(messageId);
  const updated = await prisma.$executeRaw`
    UPDATE "Model3D" SET
      "fileMessageIds" = array_append("fileMessageIds", ${id}),
      "fileNames" = array_append("fileNames", ${fileName}),
      "fileSize" = COALESCE("fileSize", 0) + ${BigInt(fileSize || 0)},
      "externalId" = COALESCE("externalId", ${externalId}),
      "updatedAt" = now()
    WHERE id = ${target.id} AND NOT (${id} = ANY("fileMessageIds"))`;
  // Tahrirlangan (allaqachon bog'langan) fayl postida hech narsa o'zgarmaydi
  if (!updated) return null;

  const { externalId: finalId } = await prisma.model3D.findUnique({ where: { id: target.id }, select: { externalId: true } });
  if (finalId) await removeOlderDuplicates(finalId);
  return target.id;
}

export async function createModel({ name, description, category, tags, previewImageUrl, sourceLink, embedding }) {
  const rows = await prisma.$queryRaw`
    INSERT INTO "Model3D" ("name", "description", "category", "tags", "previewImageUrl", "sourceLink",
      "fileMessageIds", "fileNames", "embedding", "updatedAt")
    VALUES (${name}, ${description}, ${category}, ${tags}::text[], ${previewImageUrl}, ${sourceLink},
      ARRAY[]::bigint[], ARRAY[]::text[], ${toVectorLiteral(embedding)}::halfvec, now())
    RETURNING id`;
  return rows[0].id;
}

export async function updateModel(id, { name, description, category, tags, previewImageUrl, sourceLink, embedding }) {
  await prisma.model3D.update({
    where: { id },
    data: { name, description, category, tags, previewImageUrl, sourceLink, ...(embedding ? { photoFileId: null } : {}) },
  });
  if (embedding) {
    await prisma.$executeRaw`UPDATE "Model3D" SET embedding = ${toVectorLiteral(embedding)}::halfvec WHERE id = ${id}`;
  }
}

export function deleteModel(id) {
  return prisma.model3D.delete({ where: { id } });
}
