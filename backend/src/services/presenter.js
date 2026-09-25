import { config } from '../config/default.js';
import { categoryLabel, objectLabel } from '../i18n/index.js';
import { downloadUrl } from './deliveryService.js';
import { displaySimilarity } from './searchService.js';

// Bazada rasmlar "/static/models/1.jpg" ko'rinishida saqlanadi. Frontend boshqa domenda (Vercel) bo'lganda
// ular backend'ning to'liq manziliga aylantiriladi; lokal ishlashda nisbiy qoladi.
export function absoluteUrl(url) {
  return url && url.startsWith('/') && config.publicUrl ? `${config.publicUrl}${url}` : url;
}

export function toClientModel(model, lang, { withSimilarity = false } = {}) {
  return {
    id: model.id,
    name: model.name,
    description: model.description ?? null,
    category: model.category,
    categoryLabel: categoryLabel(lang, model.category),
    tags: model.tags ?? [],
    previewImageUrl: absoluteUrl(model.previewImageUrl),
    hasFile: (model.fileMessageIds?.length ?? 0) > 0,
    fileNames: model.fileNames ?? [],
    fileSize: model.fileSize != null ? Number(model.fileSize) : null,
    downloadUrl: downloadUrl(model),
    similarity: withSimilarity && model.similarity != null ? displaySimilarity(model.similarity) : null,
  };
}

export function toClientObjects(objects, lang) {
  return (Array.isArray(objects) ? objects : []).map((o, index) => ({
    index,
    key: o.key,
    label: objectLabel(lang, o.key),
    box: o.box,
  }));
}
