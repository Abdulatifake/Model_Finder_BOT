import fs from 'fs';
import { config, hasMiniApp } from '../config/default.js';
import { t, categoryLabel, objectLabel } from '../i18n/index.js';
import { getModelsByIds, setPhotoFileId } from '../models/Model3D.js';
import { getSearch } from '../models/SearchQuery.js';
import { localPathFromUrl } from './imageService.js';
import { displaySimilarity } from './searchService.js';

const SHOW_SIMILARITY = new Set(['photo', 'crop', 'similar']);

export const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const cb = (text, data) => ({ text, callback_data: data });
const link = (text, url) => ({ text, url });

function formatSize(bytes) {
  const mb = Number(bytes) / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(Number(bytes) / 1024))} KB`;
}

function buildCaption({ lang, search, index, model, objectsCount }) {
  const lines = [];
  if (search.type === 'text') lines.push(t(lang, 'headerText', { query: escapeHtml(search.queryText) }), '');
  if (search.type === 'similar') lines.push(t(lang, 'headerSimilar', { name: escapeHtml(search.queryText) }), '');
  if (search.type === 'favorites') lines.push(t(lang, 'headerSaved'), '');

  lines.push(`<b>${escapeHtml(model.name)}</b>`);
  lines.push(`🏷 ${escapeHtml(categoryLabel(lang, model.category))}`);

  const score = search.resultScores?.[index];
  if (SHOW_SIMILARITY.has(search.type) && typeof score === 'number') {
    lines.push(`🎯 ${t(lang, 'similarity')}: ${Math.round(displaySimilarity(score) * 100)}%`);
  }
  if (model.fileNames?.length) {
    const size = model.fileSize ? ` · ${formatSize(model.fileSize)}` : '';
    lines.push(`📦 <code>${escapeHtml(model.fileNames.join(', '))}</code>${size}`);
  }
  if (search.type === 'photo' && objectsCount > 0) {
    lines.push('', t(lang, 'objectsHint', { count: objectsCount }));
  }
  return lines.join('\n').slice(0, 1024);
}

function buildKeyboard({ lang, search, index, total, model, objects, rootId, activeObject }) {
  const rows = [];

  if (total > 1) {
    rows.push([
      index > 0 ? cb('◀️', `n:${search.id}:${index - 1}`) : cb('·', 'x'),
      cb(`${index + 1} / ${total}`, 'x'),
      index < total - 1 ? cb('▶️', `n:${search.id}:${index + 1}`) : cb('·', 'x'),
    ]);
  }

  const download = model.fileMessageIds?.length
    ? cb(t(lang, 'btnDownload'), `d:${model.id}`)
    : model.sourceLink
      ? link(t(lang, 'btnDownload'), model.sourceLink)
      : model.telegramLink
        ? link(t(lang, 'btnChannel'), model.telegramLink)
        : null;
  rows.push([download, cb(t(lang, 'btnSimilar'), `s:${model.id}`)].filter(Boolean));

  const extra = [cb(t(lang, 'btnSave'), `f:${model.id}`)];
  if (hasMiniApp()) extra.push({ text: t(lang, 'btnOpenApp'), web_app: { url: config.miniAppUrl } });
  rows.push(extra);

  if (objects.length) {
    const whole = t(lang, 'btnWhole');
    const chips = [cb(activeObject === -1 ? `✅ ${whole}` : `🖼 ${whole}`, `o:${rootId}:-1`)];
    objects.forEach((o, i) => {
      const label = objectLabel(lang, o.key);
      chips.push(cb(activeObject === i ? `✅ ${label}` : `🎯 ${label}`, `o:${rootId}:${i}`));
    });
    for (let i = 0; i < chips.length; i += 3) rows.push(chips.slice(i, i + 3));
  }

  return { inline_keyboard: rows };
}

function mediaFor(model) {
  if (model.photoFileId) return model.photoFileId;
  const localPath = localPathFromUrl(model.previewImageUrl);
  if (localPath) {
    if (!fs.existsSync(localPath)) throw new Error(`Rasm fayli topilmadi: ${localPath}`);
    return { source: fs.createReadStream(localPath) };
  }
  return { url: model.previewImageUrl };
}

async function sendOrEdit(ctx, { edit, media, caption, keyboard }) {
  if (edit) {
    return ctx.editMessageMedia({ type: 'photo', media, caption, parse_mode: 'HTML' }, { reply_markup: keyboard });
  }
  return ctx.replyWithPhoto(media, { caption, parse_mode: 'HTML', reply_markup: keyboard });
}

// Qidiruv natijasini bitta xabarda karusel ko'rinishida chiqaradi (◀️ ▶️ bilan varaqlanadi)
export async function renderSearchCard(ctx, search, requestedIndex = 0, { edit = false } = {}) {
  const lang = ctx.state.lang;
  const total = search.resultIds.length;
  if (!total) {
    await ctx.reply(t(lang, 'noResults'));
    return;
  }

  const index = Math.min(Math.max(0, requestedIndex), total - 1);
  const [model] = await getModelsByIds([search.resultIds[index]]);
  if (!model) {
    await ctx.reply(t(lang, 'expired'));
    return;
  }

  const root = search.parentId ? await getSearch(search.parentId) : search;
  const objects = Array.isArray(root?.objects) ? root.objects : [];
  const caption = buildCaption({ lang, search, index, model, objectsCount: objects.length });
  const keyboard = buildKeyboard({
    lang,
    search,
    index,
    total,
    model,
    objects,
    rootId: root.id,
    activeObject: search.type === 'crop' ? search.objectIndex : -1,
  });

  let message;
  try {
    message = await sendOrEdit(ctx, { edit, media: mediaFor(model), caption, keyboard });
  } catch (err) {
    const description = err.description || '';
    if (description.includes('message is not modified')) return;
    if (!model.photoFileId) throw err;
    // Keshdagi file_id yaroqsiz bo'lib qolgan bo'lsa, rasmni qayta yuklaymiz
    await setPhotoFileId(model.id, null);
    model.photoFileId = null;
    message = await sendOrEdit(ctx, { edit, media: mediaFor(model), caption, keyboard });
  }

  const fileId = message?.photo?.at(-1)?.file_id;
  if (fileId && fileId !== model.photoFileId) await setPhotoFileId(model.id, fileId);
}
