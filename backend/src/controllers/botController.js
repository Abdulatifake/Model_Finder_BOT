import { config, hasMiniApp } from '../config/default.js';
import { t, resolveLanguage, languageLabel, objectLabel, LANGUAGE_PROMPT } from '../i18n/index.js';
import { getOrCreateUser, setUserLanguage, toggleFavorite, favoriteModelIds } from '../models/User.js';
import { createSearch, getSearch, findChildSearch } from '../models/SearchQuery.js';
import { getModelsByIds, countModels } from '../models/Model3D.js';
import { searchPhoto, searchCrop, searchText, searchSimilar } from '../services/searchService.js';
import { saveQueryImage, localPathFromUrl } from '../services/imageService.js';
import { renderSearchCard, escapeHtml } from '../services/cardService.js';
import { deliverFiles, downloadUrl } from '../services/deliveryService.js';
import { downloadTelegramFile, ingestChannelPhoto, attachChannelFile } from '../services/ingestService.js';
import { allow } from '../services/rateLimit.js';

const MAX_IMAGE_DOCUMENT_BYTES = 20 * 1024 * 1024;

let modelCountCache = { value: 0, at: 0 };
async function modelCount() {
  if (Date.now() - modelCountCache.at > 10 * 60 * 1000) {
    modelCountCache = { value: await countModels(), at: Date.now() };
  }
  return modelCountCache.value;
}

function formatNumber(value, lang) {
  return new Intl.NumberFormat(lang, { numberingSystem: 'latn' }).format(value);
}

const languageKeyboard = {
  inline_keyboard: [
    [
      { text: languageLabel('uz'), callback_data: 'l:uz' },
      { text: languageLabel('ru'), callback_data: 'l:ru' },
    ],
    [
      { text: languageLabel('en'), callback_data: 'l:en' },
      { text: languageLabel('ar'), callback_data: 'l:ar' },
    ],
  ],
};

// Har bir yangilanishda foydalanuvchini va uning tilini aniqlaydi
export async function loadUser(ctx, next) {
  if (ctx.from && !ctx.from.is_bot) {
    const user = await getOrCreateUser(ctx.from);
    ctx.state.user = user;
    ctx.state.lang = user.language ?? resolveLanguage(ctx.from.language_code) ?? 'en';
  }
  return next();
}

async function sendWelcome(ctx) {
  const { lang } = ctx.state;
  const text = t(lang, 'welcome', {
    name: escapeHtml(ctx.from.first_name),
    count: formatNumber(await modelCount(), lang),
  });
  const reply_markup = hasMiniApp()
    ? { inline_keyboard: [[{ text: t(lang, 'btnOpenApp'), web_app: { url: config.miniAppUrl } }]] }
    : undefined;
  await ctx.reply(text, { parse_mode: 'HTML', reply_markup });
}

export async function start(ctx) {
  if (!ctx.state.user.language) {
    await ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard });
    return;
  }
  await sendWelcome(ctx);
}

export function language(ctx) {
  return ctx.reply(LANGUAGE_PROMPT, { reply_markup: languageKeyboard });
}

export async function chooseLanguage(ctx) {
  const lang = ctx.match[1];
  ctx.state.user = await setUserLanguage(ctx.state.user, lang);
  ctx.state.lang = lang;

  await ctx.answerCbQuery(t(lang, 'languageChanged'));
  await ctx.editMessageText(t(lang, 'languageChanged')).catch(() => {});
  await sendWelcome(ctx);
}

export function help(ctx) {
  return ctx.reply(t(ctx.state.lang, 'help'), { parse_mode: 'HTML' });
}

export async function saved(ctx) {
  const { user, lang } = ctx.state;
  const ids = await favoriteModelIds(user.id);
  if (!ids.length) {
    await ctx.reply(t(lang, 'noSaved'));
    return;
  }
  const search = await createSearch({
    userId: user.id,
    type: 'favorites',
    source: 'bot',
    results: ids.map((id) => ({ id })),
  });
  await renderSearchCard(ctx, search, 0);
}

async function withStatus(ctx, key, task) {
  const status = await ctx.reply(t(ctx.state.lang, key));
  try {
    await task();
  } finally {
    await ctx.deleteMessage(status.message_id).catch(() => {});
  }
}

async function handleImage(ctx, fileId) {
  const { user, lang } = ctx.state;
  if (!allow('photo', user.id)) {
    await ctx.reply(t(lang, 'tooMany'));
    return;
  }

  await withStatus(ctx, 'analyzing', async () => {
    const buffer = await downloadTelegramFile(ctx.telegram, fileId);
    const image = await saveQueryImage(buffer, 'bot');
    const { results, objects } = await searchPhoto(image.filePath);
    const search = await createSearch({
      userId: user.id,
      type: 'photo',
      source: 'bot',
      imageUrl: image.url,
      objects,
      results,
    });
    await renderSearchCard(ctx, search, 0);
  });
}

export function photo(ctx) {
  return handleImage(ctx, ctx.message.photo.at(-1).file_id);
}

// Dizaynerlar ko'pincha rasmni sifat yo'qolmasligi uchun "fayl" sifatida yuborishadi
export function document(ctx) {
  const doc = ctx.message.document;
  if (doc.mime_type?.startsWith('image/') && (doc.file_size ?? 0) <= MAX_IMAGE_DOCUMENT_BYTES) {
    return handleImage(ctx, doc.file_id);
  }
  return unsupported(ctx);
}

export async function text(ctx) {
  const { user, lang } = ctx.state;
  const query = ctx.message.text.trim().slice(0, 200);
  if (query.startsWith('/')) return help(ctx);
  if (query.length < 2) return unsupported(ctx);
  if (!allow('text', user.id)) {
    await ctx.reply(t(lang, 'tooMany'));
    return;
  }

  await withStatus(ctx, 'searching', async () => {
    const results = await searchText(query);
    const search = await createSearch({ userId: user.id, type: 'text', source: 'bot', queryText: query, results });
    await renderSearchCard(ctx, search, 0);
  });
}

export function unsupported(ctx) {
  return ctx.reply(t(ctx.state.lang, 'unsupported'));
}

async function ownedSearch(ctx, id) {
  const search = await getSearch(id);
  if (!search || search.userId !== ctx.state.user.id) {
    await ctx.answerCbQuery(t(ctx.state.lang, 'expired'));
    return null;
  }
  return search;
}

export async function navigate(ctx) {
  const search = await ownedSearch(ctx, Number(ctx.match[1]));
  if (!search) return;
  await ctx.answerCbQuery();
  await renderSearchCard(ctx, search, Number(ctx.match[2]), { edit: true });
}

export async function selectObject(ctx) {
  const { user, lang } = ctx.state;
  const root = await ownedSearch(ctx, Number(ctx.match[1]));
  if (!root) return;

  const objectIndex = Number(ctx.match[2]);
  if (objectIndex < 0) {
    await ctx.answerCbQuery();
    await renderSearchCard(ctx, root, 0, { edit: true });
    return;
  }

  const object = root.objects?.[objectIndex];
  if (!object) {
    await ctx.answerCbQuery(t(lang, 'expired'));
    return;
  }
  if (!allow('crop', user.id)) {
    await ctx.answerCbQuery(t(lang, 'tooMany'));
    return;
  }

  await ctx.answerCbQuery(`🎯 ${objectLabel(lang, object.key)}`);
  let child = await findChildSearch(root.id, objectIndex);
  if (!child) {
    const results = await searchCrop(localPathFromUrl(root.imageUrl), object.box);
    child = await createSearch({
      userId: user.id,
      type: 'crop',
      source: 'bot',
      imageUrl: root.imageUrl,
      parentId: root.id,
      objectIndex,
      results,
    });
  }
  await renderSearchCard(ctx, child, 0, { edit: true });
}

export async function similar(ctx) {
  const { user, lang } = ctx.state;
  if (!allow('similar', user.id)) {
    await ctx.answerCbQuery(t(lang, 'tooMany'));
    return;
  }
  const [model] = await getModelsByIds([Number(ctx.match[1])]);
  if (!model) {
    await ctx.answerCbQuery(t(lang, 'expired'));
    return;
  }
  await ctx.answerCbQuery();
  const results = await searchSimilar(model.id);
  const search = await createSearch({
    userId: user.id,
    type: 'similar',
    source: 'bot',
    sourceModelId: model.id,
    queryText: model.name,
    results,
  });
  await renderSearchCard(ctx, search, 0);
}

export async function favorite(ctx) {
  const { user, lang } = ctx.state;
  const [model] = await getModelsByIds([Number(ctx.match[1])]);
  if (!model) {
    await ctx.answerCbQuery(t(lang, 'expired'));
    return;
  }
  const favorited = await toggleFavorite(user.id, model.id);
  await ctx.answerCbQuery(t(lang, favorited ? 'saved' : 'unsaved'));
}

export async function download(ctx) {
  const { user, lang } = ctx.state;
  if (!allow('download', user.id)) {
    await ctx.answerCbQuery(t(lang, 'tooMany'));
    return;
  }
  const [model] = await getModelsByIds([Number(ctx.match[1])]);
  if (!model) {
    await ctx.answerCbQuery(t(lang, 'expired'));
    return;
  }

  if (await deliverFiles(ctx.telegram, ctx.chat.id, model)) {
    await ctx.answerCbQuery(t(lang, 'fileSent'));
    return;
  }
  await ctx.answerCbQuery();
  const url = downloadUrl(model);
  await ctx.reply(t(lang, 'fileMissing'), {
    reply_markup: url ? { inline_keyboard: [[{ text: t(lang, 'btnChannel'), url }]] } : undefined,
  });
}

export function noop(ctx) {
  return ctx.answerCbQuery();
}

// Bot kanalga admin qilib qo'shilsa, yangi postlar avtomatik bazaga tushadi
export async function channelPost(ctx) {
  const isEdit = Boolean(ctx.editedChannelPost);
  const post = ctx.channelPost ?? ctx.editedChannelPost;
  if (post.chat.username?.toLowerCase() !== config.channelUsername.toLowerCase()) return;

  try {
    if (post.photo) {
      if (await ingestChannelPhoto(ctx.telegram, post, { isEdit })) {
        console.log(`Kanal: model ${isEdit ? 'yangilandi' : "qo'shildi"} (post #${post.message_id})`);
      }
    } else if (post.document && !isEdit) {
      const modelId = await attachChannelFile(post);
      if (modelId) console.log(`Kanal: fayl #${post.message_id} model #${modelId} ga bog'landi`);
    }
  } catch (err) {
    console.error(`Kanal postini qayta ishlashda xato (#${post.message_id}):`, err);
  }
}
