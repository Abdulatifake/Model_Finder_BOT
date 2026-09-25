import { prisma } from '../database/connection.js';

// Har bir xabarda bazaga murojaat qilmaslik uchun qisqa muddatli kesh
const cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000;

// tgUser: Telegram "user" obyekti ({ id, first_name, last_name, username, language_code })
export async function getOrCreateUser(tgUser) {
  const key = String(tgUser.id);
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) return cached.user;

  const telegramId = BigInt(tgUser.id);
  const profile = {
    firstName: tgUser.first_name ?? null,
    lastName: tgUser.last_name ?? null,
    username: tgUser.username ?? null,
  };
  const user = await prisma.user.upsert({
    where: { telegramId },
    update: profile,
    create: { telegramId, ...profile },
  });
  cache.set(key, { user, at: Date.now() });
  return user;
}

export async function setUserLanguage(user, language) {
  const updated = await prisma.user.update({ where: { id: user.id }, data: { language } });
  cache.set(String(updated.telegramId), { user: updated, at: Date.now() });
  return updated;
}

export async function toggleFavorite(userId, modelId) {
  const existing = await prisma.favorite.findUnique({ where: { userId_modelId: { userId, modelId } } });
  if (existing) {
    await prisma.favorite.delete({ where: { id: existing.id } });
    return false;
  }
  await prisma.favorite.create({ data: { userId, modelId } });
  return true;
}

export async function favoriteModelIds(userId) {
  const rows = await prisma.favorite.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    select: { modelId: true },
  });
  return rows.map((r) => r.modelId);
}
