import { prisma } from '../database/connection.js';
import { categoryLabel } from '../i18n/index.js';
import { CATEGORY_KEYS } from '../config/taxonomy.js';
import { MODEL_SELECT, createModel as insertModel, updateModel as saveModel, deleteModel as removeModel } from '../models/Model3D.js';
import { getImageEmbedding } from '../services/embeddingService.js';

const ADMIN_LANG = 'uz';

function isHttpUrl(value) {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function toAdminModel(m) {
  return {
    ...m,
    categoryLabel: categoryLabel(ADMIN_LANG, m.category),
    hasFile: m.fileMessageIds.length > 0,
    fileSize: m.fileSize != null ? Number(m.fileSize) : null,
  };
}

// Admin paneldan kelgan ma'lumotni tekshiradi; xato bo'lsa matn qaytaradi
function parseModelInput(body, { requireImage }) {
  const name = String(body.name || '').trim().slice(0, 200);
  const previewImageUrl = String(body.previewImageUrl || '').trim();
  const sourceLink = String(body.sourceLink || '').trim();
  const category = CATEGORY_KEYS.includes(body.category) ? body.category : 'other';
  const tags = (Array.isArray(body.tags) ? body.tags : [])
    .map((tag) => String(tag).trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);

  if (!name) return { error: 'Nomi majburiy' };
  if ((requireImage || previewImageUrl) && !isHttpUrl(previewImageUrl)) return { error: "Rasm URL noto'g'ri" };
  if (sourceLink && !isHttpUrl(sourceLink)) return { error: "Manba havola noto'g'ri" };

  return {
    data: {
      name,
      description: String(body.description || '').trim().slice(0, 2000) || null,
      category,
      tags,
      previewImageUrl,
      sourceLink: sourceLink || null,
    },
  };
}

export async function stats(req, res) {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  const searchTypes = { in: ['photo', 'text', 'similar', 'crop'] };

  const [modelsCount, modelsWithFile, usersCount, searchesCount, searchesToday, languages] = await Promise.all([
    prisma.model3D.count(),
    prisma.model3D.count({ where: { NOT: { fileMessageIds: { isEmpty: true } } } }),
    prisma.user.count(),
    prisma.searchQuery.count({ where: { type: searchTypes } }),
    prisma.searchQuery.count({ where: { type: searchTypes, createdAt: { gte: since } } }),
    prisma.user.groupBy({ by: ['language'], _count: { _all: true } }),
  ]);

  res.json({
    modelsCount,
    modelsWithFile,
    usersCount,
    searchesCount,
    searchesToday,
    languages: Object.fromEntries(languages.map((l) => [l.language ?? '—', l._count._all])),
  });
}

export function categories(req, res) {
  res.json(CATEGORY_KEYS.map((key) => ({ key, label: categoryLabel(ADMIN_LANG, key) })));
}

export async function listModels(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));
  const search = String(req.query.search || '').trim();
  const category = CATEGORY_KEYS.includes(req.query.category) ? req.query.category : undefined;

  const where = {
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { externalId: { contains: search.toLowerCase() } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.model3D.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { id: 'desc' },
      select: { ...MODEL_SELECT, externalId: true, createdAt: true },
    }),
    prisma.model3D.count({ where }),
  ]);

  res.json({ items: items.map(toAdminModel), total, page, pageSize });
}

export async function createModel(req, res) {
  const { data, error } = parseModelInput(req.body, { requireImage: true });
  if (error) return res.status(400).json({ error });

  const embedding = await getImageEmbedding(data.previewImageUrl);
  const id = await insertModel({ ...data, embedding });
  res.json({ id });
}

export async function updateModel(req, res) {
  const id = Number(req.params.id);
  const existing = await prisma.model3D.findUnique({ where: { id }, select: { previewImageUrl: true } });
  if (!existing) return res.status(404).json({ error: 'Model topilmadi' });

  const { data, error } = parseModelInput(req.body, { requireImage: false });
  if (error) return res.status(400).json({ error });
  if (!data.previewImageUrl) data.previewImageUrl = existing.previewImageUrl;

  const imageChanged = data.previewImageUrl !== existing.previewImageUrl;
  const embedding = imageChanged ? await getImageEmbedding(data.previewImageUrl) : null;
  await saveModel(id, { ...data, embedding });
  res.json({ id });
}

export async function deleteModel(req, res) {
  await removeModel(Number(req.params.id));
  res.json({ success: true });
}

export async function listSearches(req, res) {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(req.query.pageSize, 10) || 20));
  const where = { type: { in: ['photo', 'text', 'similar', 'crop'] } };

  const [items, total] = await Promise.all([
    prisma.searchQuery.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true, username: true, phone: true, language: true } } },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.searchQuery.count({ where }),
  ]);

  res.json({
    items: items.map((s) => ({
      id: s.id,
      type: s.type,
      source: s.source,
      queryText: s.queryText,
      imageUrl: s.imageUrl,
      resultsCount: s.resultIds.length,
      createdAt: s.createdAt,
      user: s.user,
    })),
    total,
    page,
    pageSize,
  });
}
