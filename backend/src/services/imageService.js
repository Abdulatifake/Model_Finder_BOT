import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { config } from '../config/default.js';

const THUMB_SIZE = 512;
const UPLOAD_MAX_SIZE = 1280;

export const MODEL_IMAGE_PREFIX = '/static/models/';

export async function saveModelThumbnail(input, fileName) {
  fs.mkdirSync(config.paths.models, { recursive: true });
  const target = path.join(config.paths.models, fileName);
  await sharp(input)
    .rotate()
    .resize(THUMB_SIZE, THUMB_SIZE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(target);
  return { filePath: target, url: `${MODEL_IMAGE_PREFIX}${fileName}` };
}

// Foydalanuvchi yuklagan rasmni bir xil formatga keltiradi: EXIF bo'yicha buradi, kichraytiradi, JPEG qiladi
export async function saveQueryImage(input, subdir) {
  const dir = path.join(config.paths.uploads, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}.jpg`;
  const target = path.join(dir, fileName);
  await sharp(input)
    .rotate()
    .resize(UPLOAD_MAX_SIZE, UPLOAD_MAX_SIZE, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toFile(target);
  return { filePath: target, url: `/uploads/${subdir}/${fileName}` };
}

// "/uploads/app/x.jpg" yoki "/static/models/1.jpg" -> diskdagi fayl yo'li
export function localPathFromUrl(url) {
  if (!url) return null;
  if (url.startsWith(MODEL_IMAGE_PREFIX)) return path.join(config.paths.models, path.basename(url));
  if (url.startsWith('/uploads/')) return path.join(config.paths.uploads, ...url.slice('/uploads/'.length).split('/'));
  return null;
}
