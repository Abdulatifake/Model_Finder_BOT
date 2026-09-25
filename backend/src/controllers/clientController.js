import { bot } from '../core/bot.js';
import { t, LANGUAGES, categoryLabel } from '../i18n/index.js';
import { CATEGORY_KEYS } from '../config/taxonomy.js';
import { setUserLanguage, toggleFavorite, favoriteModelIds } from '../models/User.js';
import { createSearch, getSearch, findChildSearch, listUserSearches } from '../models/SearchQuery.js';
import { getModelsByIds, listByCategory, categoryCounts } from '../models/Model3D.js';
import { searchPhoto, searchCrop, searchText, searchSimilar } from '../services/searchService.js';
import { saveQueryImage, localPathFromUrl } from '../services/imageService.js';
import { deliverFiles, downloadUrl } from '../services/deliveryService.js';
import { toClientModel, toClientObjects, absoluteUrl } from '../services/presenter.js';
import { allow } from '../services/rateLimit.js';

const PAGE_SIZE = 20;
const SIMILARITY_TYPES = new Set(['photo', 'crop', 'similar']);

let categoryCache = { at: 0, counts: {} };

function pageFrom(value) {
  return Math.min(Math.max(1, Number.parseInt(value, 10) || 1), 500);
}

function categoryFrom(value) {
  return CATEGORY_KEYS.includes(value) ? value : undefined;
}

function tooMany(res, lang) {
  return res.status(429).json({ error: t(lang, 'tooMany') });
}

function notFound(res) {
  return res.status(404).json({ error: 'not_found' });
}

async function loadSearchModels(search) {
  const models = await getModelsByIds(search.resultIds);
  const scores = new Map(search.resultIds.map((id, i) => [id, search.resultScores[i]]));
  return models.map((m) => ({ ...m, similarity: scores.get(m.id) }));
}

function presentSearch(search, models, lang, root = search) {
  return {
    searchId: search.id,
    rootId: root.id,
    type: search.type,
    imageUrl: absoluteUrl(root.imageUrl) ?? null,
    queryText: search.queryText ?? null,
    objects: toClientObjects(root.objects, lang),
    activeObject: search.type === 'crop' ? search.objectIndex : -1,
    items: models.map((m) => toClientModel(m, lang, { withSimilarity: SIMILARITY_TYPES.has(search.type) })),
  };
}

export function me(req, res) {
  res.json({
    firstName: req.user.firstName,
    lastName: req.user.lastName,
    username: req.user.username,
    language: req.lang,
    languageChosen: Boolean(req.user.language),
  });
}

export async function setLanguage(req, res) {
  const { language } = req.body;
  if (!LANGUAGES.includes(language)) return res.status(400).json({ error: 'language' });
  await setUserLanguage(req.user, language);
  res.json({ language });
}

export async function categories(req, res) {
  if (Date.now() - categoryCache.at > 10 * 60 * 1000) {
    categoryCache = { at: Date.now(), counts: await categoryCounts() };
  }
  res.json(
    CATEGORY_KEYS.filter((key) => categoryCache.counts[key]).map((key) => ({
      key,
      label: categoryLabel(req.lang, key),
      count: categoryCache.counts[key],
    }))
  );
}

export async function catalog(req, res) {
  const page = pageFrom(req.query.page);
  const models = await listByCategory({
    category: categoryFrom(req.query.category),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  res.json({ items: models.map((m) => toClientModel(m, req.lang)), hasMore: models.length === PAGE_SIZE });
}

export async function textSearch(req, res) {
  const query = String(req.body.query || '').trim().slice(0, 200);
  if (query.length < 2) return res.status(400).json({ error: 'query' });
  if (!allow('text', req.user.id)) return tooMany(res, req.lang);

  const page = pageFrom(req.body.page);
  const results = await searchText(query, {
    category: categoryFrom(req.body.category),
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const search =
    page === 1
      ? await createSearch({ userId: req.user.id, type: 'text', source: 'app', queryText: query, results })
      : null;

  res.json({
    searchId: search?.id ?? null,
    type: 'text',
    queryText: query,
    objects: [],
    activeObject: -1,
    items: results.map((m) => toClientModel(m, req.lang)),
    hasMore: results.length === PAGE_SIZE,
  });
}

export async function photoSearch(req, res) {
  if (!req.file) return res.status(400).json({ error: 'photo' });
  if (!allow('photo', req.user.id)) return tooMany(res, req.lang);

  const image = await saveQueryImage(req.file.buffer, 'app');
  const { results, objects } = await searchPhoto(image.filePath);
  const search = await createSearch({
    userId: req.user.id,
    type: 'photo',
    source: 'app',
    imageUrl: image.url,
    objects,
    results,
  });
  res.json(presentSearch(search, results, req.lang));
}

export async function objectSearch(req, res) {
  const root = await getSearch(Number(req.body.searchId));
  if (!root || root.userId !== req.user.id || root.type !== 'photo') return notFound(res);

  const objectIndex = Number(req.body.objectIndex);
  if (objectIndex === -1) return res.json(presentSearch(root, await loadSearchModels(root), req.lang));

  const object = root.objects?.[objectIndex];
  if (!object) return notFound(res);

  let child = await findChildSearch(root.id, objectIndex);
  let models;
  if (child) {
    models = await loadSearchModels(child);
  } else {
    if (!allow('crop', req.user.id)) return tooMany(res, req.lang);
    models = await searchCrop(localPathFromUrl(root.imageUrl), object.box);
    child = await createSearch({
      userId: req.user.id,
      type: 'crop',
      source: 'app',
      imageUrl: root.imageUrl,
      parentId: root.id,
      objectIndex,
      results: models,
    });
  }
  res.json(presentSearch(child, models, req.lang, root));
}

export async function similar(req, res) {
  const [model] = await getModelsByIds([Number(req.params.id)]);
  if (!model) return notFound(res);
  if (!allow('similar', req.user.id)) return tooMany(res, req.lang);

  const results = await searchSimilar(model.id);
  const search = await createSearch({
    userId: req.user.id,
    type: 'similar',
    source: 'app',
    sourceModelId: model.id,
    queryText: model.name,
    results,
  });
  res.json(presentSearch(search, results, req.lang));
}

export async function getSearchResults(req, res) {
  const search = await getSearch(Number(req.params.id));
  if (!search || search.userId !== req.user.id) return notFound(res);
  const root = search.parentId ? await getSearch(search.parentId) : search;
  res.json(presentSearch(search, await loadSearchModels(search), req.lang, root));
}

export async function history(req, res) {
  const searches = await listUserSearches(req.user.id, 30);
  const previewIds = [...new Set(searches.flatMap((s) => s.resultIds.slice(0, 3)))];
  const previews = new Map((await getModelsByIds(previewIds)).map((m) => [m.id, m.previewImageUrl]));

  res.json(
    searches.map((s) => ({
      id: s.id,
      type: s.type,
      queryText: s.queryText,
      imageUrl: absoluteUrl(s.imageUrl),
      createdAt: s.createdAt,
      count: s.resultIds.length,
      previews: s.resultIds
        .slice(0, 3)
        .map((id) => absoluteUrl(previews.get(id)))
        .filter(Boolean),
    }))
  );
}

export async function favorites(req, res) {
  const models = await getModelsByIds(await favoriteModelIds(req.user.id));
  res.json(models.map((m) => toClientModel(m, req.lang)));
}

export async function favoriteIds(req, res) {
  res.json(await favoriteModelIds(req.user.id));
}

export async function toggleFavoriteModel(req, res) {
  const [model] = await getModelsByIds([Number(req.body.modelId)]);
  if (!model) return notFound(res);
  res.json({ favorited: await toggleFavorite(req.user.id, model.id) });
}

// Faylni bot orqali foydalanuvchining Telegram chatiga yuboradi
export async function deliver(req, res) {
  const [model] = await getModelsByIds([Number(req.body.modelId)]);
  if (!model) return notFound(res);
  if (!allow('download', req.user.id)) return tooMany(res, req.lang);

  const delivered = await deliverFiles(bot.telegram, Number(req.user.telegramId), model);
  res.json(delivered ? { mode: 'file' } : { mode: 'link', url: downloadUrl(model) });
}
