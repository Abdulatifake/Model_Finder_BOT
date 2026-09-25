import crypto from 'crypto';
import { config } from '../config/default.js';
import { getOrCreateUser } from '../models/User.js';
import { resolveLanguage } from '../i18n/index.js';

const INIT_DATA_MAX_AGE_SECONDS = 24 * 60 * 60;
const ADMIN_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const DEV_USER = { id: 999999999, first_name: 'Dev', language_code: 'uz' };

export function safeEqual(a, b) {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
}

// Tunnel yoki hosting proksisi orqali kelgan so'rovlar shu sarlavhalardan birini olib keladi
function isLocalRequest(req) {
  return !req.headers['x-forwarded-for'] && !req.headers['cf-connecting-ip'] && !req.headers['x-forwarded-host'];
}

// Telegram Mini App'dan kelgan initData imzosini tekshiradi va foydalanuvchini aniqlaydi.
// Mijoz yuborgan telegramId'ga hech qachon ishonilmaydi — faqat imzolangan ma'lumotdagi user ishlatiladi.
function verifyInitData(initData) {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return null;
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  const secretKey = crypto.createHmac('sha256', 'WebAppData').update(config.botToken).digest();
  const expected = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');
  if (!safeEqual(expected, hash)) return null;

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > INIT_DATA_MAX_AGE_SECONDS) return null;

  try {
    return JSON.parse(params.get('user'));
  } catch {
    return null;
  }
}

export async function telegramAuth(req, res, next) {
  const initData = req.headers['x-telegram-init-data'];
  let tgUser = initData ? verifyInitData(String(initData)) : null;

  // Faqat lokal ishlab chiqishda: Mini App'ni oddiy brauzerda (Telegram'siz) ochib ko'rish uchun
  if (!tgUser && !initData && config.allowDevBypass && isLocalRequest(req)) tgUser = DEV_USER;

  if (!tgUser?.id) return res.status(401).json({ error: 'unauthorized' });

  try {
    req.user = await getOrCreateUser(tgUser);
    req.lang = req.user.language ?? resolveLanguage(tgUser.language_code) ?? 'en';
    next();
  } catch (err) {
    next(err);
  }
}

function signAdminPayload(payload) {
  return crypto.createHmac('sha256', config.adminTokenSecret).update(payload).digest('base64url');
}

// Admin parol bilan kirgach beriladigan imzolangan token: "<payload>.<imzo>"
export function issueAdminToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + ADMIN_TOKEN_TTL_MS })).toString('base64url');
  return `${payload}.${signAdminPayload(payload)}`;
}

function verifyAdminToken(token) {
  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, signAdminPayload(payload))) return false;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString()).exp > Date.now();
  } catch {
    return false;
  }
}

export function adminAuth(req, res, next) {
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!config.adminTokenSecret || !token || !verifyAdminToken(token)) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }
  next();
}
