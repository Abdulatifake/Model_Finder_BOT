import fs from 'fs';
import path from 'path';
import { env, pipeline, RawImage } from '@xenova/transformers';
import { config } from '../config/default.js';
import { translateQuery } from './queryTranslate.js';

env.cacheDir = config.paths.cache;

const IMAGE_MODEL = 'Xenova/clip-vit-base-patch32';
// CLIP ViT-B/32 rasm fazosiga moslab o'qitilgan ko'p tilli matn modeli (50+ til)
const TEXT_MODEL = 'sentence-transformers/clip-ViT-B-32-multilingual-v1';
const DENSE_URL = `https://huggingface.co/${TEXT_MODEL}/resolve/main/2_Dense/model.safetensors`;

let imageExtractorPromise;
let textModelPromise;

function normalize(values) {
  let sum = 0;
  for (const v of values) sum += v * v;
  const norm = Math.sqrt(sum) || 1;
  return Float32Array.from(values, (v) => v / norm);
}

function getImageExtractor() {
  imageExtractorPromise ??= pipeline('image-feature-extraction', IMAGE_MODEL);
  return imageExtractorPromise;
}

export function loadImage(source) {
  return RawImage.read(source);
}

// source: lokal fayl yo'li, http(s) URL yoki RawImage
export async function getImageEmbedding(source) {
  const extractor = await getImageExtractor();
  const output = await extractor(source);
  return normalize(output.data);
}

// Sentence-transformers modelidagi yakuniy Dense qatlam (768 -> 512) ONNX faylga kirmagan,
// shuning uchun uning og'irliklari safetensors'dan o'qilib, JS'da qo'llaniladi.
async function loadDenseLayer() {
  const file = path.join(config.paths.cache, 'clip-multilingual-dense.safetensors');
  if (!fs.existsSync(file)) {
    const res = await fetch(DENSE_URL);
    if (!res.ok) throw new Error(`Dense qatlamni yuklab bo'lmadi: ${res.status}`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }

  const buf = fs.readFileSync(file);
  const headerLength = Number(buf.readBigUInt64LE(0));
  const header = JSON.parse(buf.subarray(8, 8 + headerLength).toString('utf8'));
  const tensor = header['linear.weight'];
  const [start, end] = tensor.data_offsets;
  const bytes = buf.subarray(8 + headerLength + start, 8 + headerLength + end);
  const weights = new Float32Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
  const [outDim, inDim] = tensor.shape;
  return { weights, outDim, inDim };
}

async function loadTextModel() {
  const [extractor, dense] = await Promise.all([
    pipeline('feature-extraction', TEXT_MODEL, { quantized: false, model_file_name: 'model_quint8_avx2' }),
    loadDenseLayer(),
  ]);
  return { extractor, dense };
}

export async function getTextEmbedding(text) {
  textModelPromise ??= loadTextModel();
  const { extractor, dense } = await textModelPromise;
  const pooled = (await extractor(translateQuery(text), { pooling: 'mean' })).data;

  const { weights, outDim, inDim } = dense;
  const projected = new Float32Array(outDim);
  for (let o = 0; o < outDim; o++) {
    let sum = 0;
    const row = o * inDim;
    for (let i = 0; i < inDim; i++) sum += weights[row + i] * pooled[i];
    projected[o] = sum;
  }
  return normalize(projected);
}

export async function warmUpEmbeddings() {
  textModelPromise ??= loadTextModel();
  await Promise.all([getImageExtractor(), textModelPromise]);
}
