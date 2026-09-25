import fs from 'fs';
import { parseExportCaption, normalizeExternalId, multipartBase } from './captionParser.js';

// Eksport hali tugamagan bo'lsa ham, oxirgi to'liq yozilgan xabargacha o'qiydi
export function readExport(file) {
  const raw = fs.readFileSync(file, 'utf-8');
  try {
    return { data: JSON.parse(raw), partial: false };
  } catch {
    const cut = raw.lastIndexOf('\n  }');
    return { data: JSON.parse(`${raw.slice(0, cut + 4)}\n ]\n}`), partial: true };
  }
}

// Kanal tuzilishi: rasm posti (caption'da 3dsky ID) -> keyingi xabarda shu ID nomli .rar/.zip fayl
export function groupPosts(messages) {
  const posts = [];
  const byExternalId = new Map();
  let lastPost = null;
  let unlinkedFiles = 0;

  for (const m of messages) {
    if (m.type !== 'message') continue;

    if (typeof m.photo === 'string' && !m.photo.startsWith('(')) {
      lastPost = { messageId: m.id, photo: m.photo, meta: parseExportCaption(m.text_entities), files: [] };
      posts.push(lastPost);
      if (lastPost.meta.externalId) byExternalId.set(lastPost.meta.externalId, lastPost);
    } else if (m.file || m.mime_type) {
      const file = { id: m.id, name: m.file_name ?? '', size: m.file_size ?? 0 };
      const base = multipartBase(file.name);
      let target = byExternalId.get(normalizeExternalId(file.name));
      if (!target && lastPost) {
        if (!lastPost.files.length && m.id - lastPost.messageId <= 3) target = lastPost;
        // Katta to'plamlar (Maxtree, Evermotion) part1..partN bo'lib keladi — arxiv faqat barcha qismlar bilan ochiladi
        else if (base && (!lastPost.multipartBase || lastPost.multipartBase === base)) target = lastPost;
      }
      if (target) {
        target.files.push(file);
        if (base && target === lastPost) lastPost.multipartBase ??= base;
      } else {
        unlinkedFiles++;
      }
    }
  }

  // Yangi formatdagi postlarda 3dsky ID caption'da emas, faqat fayl nomida bo'ladi
  for (const post of posts) {
    post.meta.externalId ??= post.files.map((f) => normalizeExternalId(f.name)).find(Boolean) ?? null;
  }
  return { posts, unlinkedFiles };
}

// Bir xil model kanalga qayta joylangan bo'lsa, faqat eng oxirgisi qoladi
export function dedupe(posts) {
  const seen = new Set();
  const result = [];
  for (let i = posts.length - 1; i >= 0; i--) {
    const post = posts[i];
    const key = post.meta.externalId;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);
    result.push(post);
  }
  return result.reverse();
}
