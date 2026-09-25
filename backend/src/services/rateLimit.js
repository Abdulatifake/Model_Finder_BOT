const buckets = new Map();
const WINDOW_MS = 60_000;

export const LIMITS = {
  photo: 15,
  text: 30,
  similar: 30,
  crop: 30,
  download: 20,
  // Admin parolini tanlab topishga urinishlardan himoya (IP bo'yicha)
  login: 10,
};

// Og'ir (AI) so'rovlarni bir foydalanuvchi daqiqasiga cheksiz yubora olmasligi uchun
export function allow(bucket, clientKey) {
  const key = `${bucket}:${clientKey}`;
  const now = Date.now();
  const hits = (buckets.get(key) || []).filter((time) => now - time < WINDOW_MS);
  const allowed = hits.length < LIMITS[bucket];
  if (allowed) hits.push(now);
  buckets.set(key, hits);
  return allowed;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, hits] of buckets) {
    if (!hits.some((time) => now - time < WINDOW_MS)) buckets.delete(key);
  }
}, 5 * WINDOW_MS).unref();
