import { pipeline } from '@xenova/transformers';
import { DETECTION_LABELS } from '../config/taxonomy.js';

const MODEL = 'Xenova/owlvit-base-patch32';
const LABELS = Object.keys(DETECTION_LABELS);
// OWL-ViT CLIP kabi o'qitilgan: "a photo of a ..." shabloni ishonchni ~5 barobar oshiradi va yorliqlarni aniqlashtiradi
const QUERIES = LABELS.map((label) => `a photo of a ${label}`);
const THRESHOLD = 0.1;
const MAX_OBJECTS = 6;
const CROP_PADDING = 0.06;

let detectorPromise;

function getDetector() {
  detectorPromise ??= pipeline('zero-shot-object-detection', MODEL);
  return detectorPromise;
}

function area(box) {
  return (box.xmax - box.xmin) * (box.ymax - box.ymin);
}

function iou(a, b) {
  const w = Math.max(0, Math.min(a.xmax, b.xmax) - Math.max(a.xmin, b.xmin));
  const h = Math.max(0, Math.min(a.ymax, b.ymax) - Math.max(a.ymin, b.ymin));
  const inter = w * h;
  return inter / (area(a) + area(b) - inter);
}

const round = (v) => Math.round(Math.min(1, Math.max(0, v)) * 10000) / 10000;

// Natija: [{ key, score, box: {xmin, ymin, xmax, ymax} }] — koordinatalar 0..1 oralig'ida
export async function detectObjects(image) {
  const detector = await getDetector();
  const detections = await detector(image, QUERIES, { threshold: THRESHOLD, percentage: true });

  const kept = [];
  const seenKeys = new Set();
  for (const d of detections.sort((a, b) => b.score - a.score)) {
    const key = DETECTION_LABELS[LABELS[QUERIES.indexOf(d.label)]];
    const size = area(d.box);
    // Juda kichik qutilar shovqin, deyarli butun rasmni egallaganlari esa "butun rasm" qidiruvidan farq qilmaydi
    if (size < 0.015 || size > 0.85) continue;
    if (seenKeys.has(key)) continue;
    if (kept.some((k) => iou(k.box, d.box) > 0.5)) continue;

    seenKeys.add(key);
    kept.push({
      key,
      score: Math.round(d.score * 1000) / 1000,
      box: { xmin: round(d.box.xmin), ymin: round(d.box.ymin), xmax: round(d.box.xmax), ymax: round(d.box.ymax) },
    });
    if (kept.length >= MAX_OBJECTS) break;
  }
  return kept;
}

// Buyum atrofida biroz kontekst qoldirib qirqadi (CLIP buyumni fonda yaxshiroq taniydi)
export function cropToBox(image, box) {
  const padX = (box.xmax - box.xmin) * CROP_PADDING;
  const padY = (box.ymax - box.ymin) * CROP_PADDING;
  const x1 = Math.max(0, Math.floor((box.xmin - padX) * image.width));
  const y1 = Math.max(0, Math.floor((box.ymin - padY) * image.height));
  const x2 = Math.min(image.width - 1, Math.ceil((box.xmax + padX) * image.width));
  const y2 = Math.min(image.height - 1, Math.ceil((box.ymax + padY) * image.height));
  return image.crop([x1, y1, x2, y2]);
}

export function warmUpDetector() {
  return getDetector();
}
