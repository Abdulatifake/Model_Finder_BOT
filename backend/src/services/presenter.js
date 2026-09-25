import { categoryLabel, objectLabel } from '../i18n/index.js';
import { downloadUrl } from './deliveryService.js';
import { displaySimilarity } from './searchService.js';

export function toClientModel(model, lang, { withSimilarity = false } = {}) {
  return {
    id: model.id,
    name: model.name,
    description: model.description ?? null,
    category: model.category,
    categoryLabel: categoryLabel(lang, model.category),
    tags: model.tags ?? [],
    previewImageUrl: model.previewImageUrl,
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
