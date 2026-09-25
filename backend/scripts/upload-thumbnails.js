// Kompyuterdagi kichik rasmlarni (public/models) serverdagi doimiy diskka yuklaydi.
// Qayta ishga tushirilsa, serverda borlarini o'tkazib yuboradi.
// Ishlatish: npm run upload-thumbnails -- https://model-finder-uz-api.onrender.com
import fs from 'fs';
import path from 'path';
import { config } from '../src/config/default.js';

const server = (process.argv[2] || '').replace(/\/$/, '');
const BATCH_SIZE = 300;
const PARALLEL = 4;
const NAME_RE = /^\d+\.jpg$/;

if (!server.startsWith('https://') || !config.adminPassword) {
  console.error(
    "Ishlatish: npm run upload-thumbnails -- https://<server>.onrender.com\n(backend/.env faylida serverdagi bilan bir xil ADMIN_PASSWORD bo'lishi kerak)"
  );
  process.exit(1);
}

async function request(pathname, options = {}, attempts = 3) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(`${server}${pathname}`, options);
      if (res.status < 500) return res;
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt >= attempts) throw err;
      await new Promise((resolve) => setTimeout(resolve, 3000 * attempt));
    }
  }
}

const loginRes = await request('/api/admin/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: config.adminPassword }),
});
const { token, error } = await loginRes.json();
if (!token) {
  console.error(`Serverga kirib bo'lmadi: ${error}`);
  process.exit(1);
}
const auth = { Authorization: `Bearer ${token}` };

const existing = new Set((await (await request('/api/admin/thumbnails', { headers: auth })).json()).names);
const todo = fs.readdirSync(config.paths.models).filter((name) => NAME_RE.test(name) && !existing.has(name));
console.log(`Serverda bor: ${existing.size} | yuklanadi: ${todo.length}`);

const batches = [];
for (let i = 0; i < todo.length; i += BATCH_SIZE) batches.push(todo.slice(i, i + BATCH_SIZE));

let uploaded = 0;
const started = Date.now();

async function uploadBatch(names) {
  const form = new FormData();
  for (const name of names) {
    form.append('files', new Blob([fs.readFileSync(path.join(config.paths.models, name))], { type: 'image/jpeg' }), name);
  }
  const res = await request('/api/admin/thumbnails', { method: 'POST', headers: auth, body: form });
  if (!res.ok) throw new Error(`Yuklashda xato: HTTP ${res.status}`);
  uploaded += (await res.json()).saved;

  const perSecond = uploaded / ((Date.now() - started) / 1000);
  const minutesLeft = Math.round((todo.length - uploaded) / perSecond / 60);
  console.log(`${uploaded} / ${todo.length} (${((uploaded / todo.length) * 100).toFixed(1)}%) · qoldi ≈ ${minutesLeft} daq`);
}

async function worker() {
  while (batches.length) await uploadBatch(batches.shift());
}

await Promise.all(Array.from({ length: PARALLEL }, worker));
console.log(`\n✅ Tugadi! Yuklandi: ${uploaded}`);
