import { getImageEmbedding, getTextEmbedding, loadImage } from './embeddingService.js';
import { detectObjects, cropToBox } from './detectionService.js';
import { translateQuery } from './queryTranslate.js';
import { findNearest, findByText, findSimilarTo } from '../models/Model3D.js';

const RESULT_LIMIT = 20;
const STOP_WORDS = new Set(['the', 'and', 'for', 'with', 'bilan', 'uchun', 'для', 'из', 'или', 'من', 'في', 'مع']);

export async function searchPhoto(filePath) {
  const image = await loadImage(filePath);
  const [embedding, objects] = await Promise.all([getImageEmbedding(image), detectObjects(image)]);
  const results = await findNearest(embedding, { limit: RESULT_LIMIT });
  return { results, objects };
}

export async function searchCrop(filePath, box) {
  const image = await loadImage(filePath);
  const crop = await cropToBox(image, box);
  return findNearest(await getImageEmbedding(crop), { limit: RESULT_LIMIT });
}

function keywords(query) {
  const tokens = `${query} ${translateQuery(query)}`.toLowerCase().split(/[^\p{L}\p{N}_]+/u);
  return [...new Set(tokens)].filter((w) => w.length >= 3 && !STOP_WORDS.has(w)).slice(0, 8);
}

export async function searchText(query, { category, limit = RESULT_LIMIT, offset = 0 } = {}) {
  const embedding = await getTextEmbedding(query);
  return findByText(embedding, keywords(query), { category, limit, offset });
}

export function searchSimilar(modelId) {
  return findSimilarTo(modelId, { limit: RESULT_LIMIT });
}

// CLIP'da hatto aloqasiz rasmlar ham ~0.5 kosinus o'xshashlikka ega bo'ladi,
// shuning uchun foydalanuvchiga ko'rsatishdan oldin shkala 0..1 ga keltiriladi.
export function displaySimilarity(score) {
  return Math.min(1, Math.max(0, (Number(score) - 0.45) / 0.5));
}
