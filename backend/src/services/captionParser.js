import { CATEGORY_RULES } from '../config/taxonomy.js';

// 3dsky model identifikatori: raqam + "." (ba'zan "_") + 13 ta hex belgi, masalan 5361128.6489a675c60ae
const EXTERNAL_ID_RE = /(\d{1,9})[._]([0-9a-f]{13})/i;

export function normalizeExternalId(value) {
  const match = String(value || '').match(EXTERNAL_ID_RE);
  return match ? `${match[1]}.${match[2].toLowerCase()}` : null;
}

// Ko'p qismli arxiv: "Maxtree Vol.14.part3.rar" yoki "scene.7z.002" -> umumiy asos nomi
const MULTIPART_RE = /^(.*)\.part0*\d+\.rar$|^(.*\.7z)\.\d{3}$/i;

export function multipartBase(fileName) {
  const match = String(fileName || '').match(MULTIPART_RE);
  return match ? (match[1] ?? match[2]).toLowerCase() : null;
}

const RENDERER_RE = /^(?:v-?ray|corona|fstorm|octane|redshift|arnold|standard|scanline)(?:\s*\+\s*(?:v-?ray|corona))?$/i;

// Kanalning yangi formati: "Pro 3dsky | Kategoriya / Bo'lim | Nomi | Render" (Kategoriya qismi bo'lmasligi ham mumkin)
function parsePipeFormat(text) {
  const firstLine = text.split('\n')[0].replace(/#[\p{L}\p{N}_]+/gu, ' ');
  if (!/^\s*pro\s*3dsky\s*\|/i.test(firstLine)) return null;

  const parts = firstLine
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(1);
  if (parts.length && RENDERER_RE.test(parts.at(-1))) parts.pop();
  const categoryPath = parts.length > 1 && parts[0].includes('/') ? parts.shift() : '';

  return {
    name: parts.join(' | '),
    categoryWords: categoryPath.toLowerCase().split(/[^\p{L}\p{N}_]+/u).filter(Boolean),
  };
}

function normalizeTag(tag) {
  return tag.replace(/^#/, '').toLowerCase().trim();
}

export function detectCategory(tags, name) {
  const tagSet = new Set(tags);
  for (const rule of CATEGORY_RULES) {
    if (rule.tokens.some((token) => tagSet.has(token))) return rule.key;
  }
  const words = new Set(name.toLowerCase().split(/[^\p{L}\p{N}_]+/u).filter(Boolean));
  for (const rule of CATEGORY_RULES) {
    if (rule.tokens.some((token) => words.has(token))) return rule.key;
  }
  return 'other';
}

function cleanName(text) {
  return text
    .split('\n')
    .filter((line) => !/PRO\s*MODELS/i.test(line))
    .join(' ')
    .replace(/#[\p{L}\p{N}_]+/gu, ' ')
    .replace(new RegExp(EXTERNAL_ID_RE.source, 'gi'), ' ')
    .replace(/@\w+/g, ' ')
    .replace(/[\p{Extended_Pictographic}️‍]/gu, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:–—\-|]+|[\s,.;:–—\-|]+$/g, '')
    .slice(0, 200);
}

// text: to'liq caption matni; hashtags: ['#sofa', ...]; links: ['https://...']
export function parseCaption({ text = '', hashtags = [], links = [] }) {
  const tags = [...new Set(hashtags.map(normalizeTag).filter(Boolean))];
  const pipe = parsePipeFormat(text);
  const name = cleanName(pipe ? pipe.name : text);
  const sourceLink = links.find((l) => !/^https?:\/\/(t\.me|telegram\.me)\//i.test(l)) ?? null;

  return {
    externalId: normalizeExternalId(text),
    name,
    category: detectCategory([...tags, ...(pipe?.categoryWords ?? [])], name),
    tags,
    sourceLink,
  };
}

// Telegram Desktop JSON eksportidagi "text_entities" massivi uchun
export function parseExportCaption(entities = []) {
  const text = entities.map((e) => e.text).join('');
  const hashtags = entities.filter((e) => e.type === 'hashtag').map((e) => e.text);
  const links = entities
    .map((e) => e.href || (e.type === 'link' ? e.text : null))
    .filter(Boolean)
    .map((l) => (l.startsWith('http') ? l : `https://${l}`));
  return parseCaption({ text, hashtags, links });
}

// Bot API (channel_post) caption + caption_entities uchun
export function parseBotCaption(caption = '', entities = []) {
  const slice = (e) => caption.slice(e.offset, e.offset + e.length);
  const hashtags = entities.filter((e) => e.type === 'hashtag').map(slice);
  const links = entities
    .map((e) => (e.type === 'text_link' ? e.url : e.type === 'url' ? slice(e) : null))
    .filter(Boolean)
    .map((l) => (l.startsWith('http') ? l : `https://${l}`));
  return parseCaption({ text: caption, hashtags, links });
}
