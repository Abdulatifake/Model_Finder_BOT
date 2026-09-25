import { prisma } from '../database/connection.js';

export const HISTORY_TYPES = ['photo', 'text', 'similar'];

export function createSearch({ results = [], ...data }) {
  return prisma.searchQuery.create({
    data: {
      ...data,
      resultIds: results.map((r) => r.id),
      resultScores: results.map((r) => Number(r.similarity ?? 0)),
    },
  });
}

export function getSearch(id) {
  return prisma.searchQuery.findUnique({ where: { id } });
}

export function findChildSearch(parentId, objectIndex) {
  return prisma.searchQuery.findFirst({ where: { parentId, objectIndex }, orderBy: { id: 'desc' } });
}

export function listUserSearches(userId, take = 20) {
  return prisma.searchQuery.findMany({
    where: { userId, type: { in: HISTORY_TYPES } },
    orderBy: { createdAt: 'desc' },
    take,
  });
}
