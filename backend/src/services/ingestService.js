import { config } from '../config/default.js';
import { categoryLabel } from '../i18n/index.js';
import { getImageEmbedding } from './embeddingService.js';
import { saveModelThumbnail } from './imageService.js';
import { parseBotCaption } from './captionParser.js';
import { upsertModels, attachFile, channelModelExists } from '../models/Model3D.js';

// Caption'da nom bo'lmasa (faqat ID va hashteglar), nom teglardan yasaladi: #decor #vase #glass -> "Decor vase glass"
function fallbackName(meta, messageId) {
  const words = meta.tags.slice(0, 3).map((tag) => tag.replace(/_/g, ' '));
  if (words.length) return words.join(' ').replace(/^./, (c) => c.toUpperCase());
  return `${categoryLabel('en', meta.category)} 3D model #${messageId}`;
}

export function buildModelRow({ messageId, meta, previewImageUrl, files, embedding }) {
  return {
    telegramMessageId: BigInt(messageId),
    externalId: meta.externalId,
    name: meta.name || fallbackName(meta, messageId),
    category: meta.category,
    tags: meta.tags,
    previewImageUrl,
    telegramLink: `https://t.me/${config.channelUsername}/${messageId}`,
    sourceLink: meta.sourceLink,
    fileMessageIds: files.map((f) => BigInt(f.id)),
    fileNames: files.map((f) => f.name),
    fileSize: files.length ? BigInt(files.reduce((sum, f) => sum + (f.size || 0), 0)) : null,
    embedding,
  };
}

// Telegram serveri bilan ulanish vaqti-vaqti bilan uziladi (ECONNRESET) — bir necha marta qayta uriniladi
export async function downloadTelegramFile(telegram, fileId, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const link = await telegram.getFileLink(fileId);
      const res = await fetch(link);
      if (!res.ok) throw new Error(`Telegram faylini yuklab bo'lmadi: ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
    }
  }
}

// Kanalga yangi rasm posti tushganda (bot kanal admini bo'lishi kerak).
// Tahrirlangan postda faqat bazada bor model yangilanadi — import ataylab tashlab ketgan
// takroriy/faylsiz eski postlar qayta paydo bo'lmasligi uchun.
export async function ingestChannelPhoto(telegram, post, { isEdit = false } = {}) {
  if (isEdit && !(await channelModelExists(post.message_id))) return false;

  const buffer = await downloadTelegramFile(telegram, post.photo.at(-1).file_id);
  const thumb = await saveModelThumbnail(buffer, `${post.message_id}.jpg`);
  const meta = parseBotCaption(post.caption ?? '', post.caption_entities ?? []);
  const embedding = await getImageEmbedding(thumb.filePath);
  await upsertModels([buildModelRow({ messageId: post.message_id, meta, previewImageUrl: thumb.url, files: [], embedding })]);
  return true;
}

// Rasm postidan keyin keladigan .rar/.zip fayl posti
export function attachChannelFile(post) {
  return attachFile({
    messageId: post.message_id,
    fileName: post.document.file_name ?? '',
    fileSize: post.document.file_size ?? 0,
  });
}
