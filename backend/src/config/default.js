import 'dotenv/config';
import path from 'path';

// Serverda (Render) doimiy disk DATA_DIR ga ulanadi: kichik rasmlar, yuklamalar va AI modellar keshi o'sha yerda saqlanadi
const dataDir = process.env.DATA_DIR;

const list = (value) =>
  String(value || '')
    .split(',')
    .map((item) => item.trim().replace(/\/$/, ''))
    .filter(Boolean);

export const config = {
  port: Number(process.env.PORT) || 4000,
  botToken: process.env.BOT_TOKEN,
  channelUsername: (process.env.CHANNEL_USERNAME || 'PROMODELS2028').replace(/^@/, ''),
  miniAppUrl: process.env.MINI_APP_URL || '',
  tunnel: process.env.TUNNEL || '',
  // Backend'ning ommaviy HTTPS manzili. Render uni RENDER_EXTERNAL_URL orqali o'zi beradi;
  // u bo'lsa, bot webhook rejimida ishlaydi va rasmlar to'liq URL bilan qaytariladi.
  publicUrl: (process.env.PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || '').replace(/\/$/, ''),
  forcePolling: process.env.BOT_MODE === 'polling',
  // Vercel'dagi Mini App va admin panel manzillari (CORS uchun)
  allowedOrigins: list(process.env.ALLOWED_ORIGINS),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminTokenSecret: process.env.ADMIN_TOKEN_SECRET || '',
  allowDevBypass: process.env.ALLOW_DEV_BYPASS === 'true',
  paths: {
    models: dataDir ? path.join(dataDir, 'models') : path.resolve('public/models'),
    uploads: dataDir ? path.join(dataDir, 'uploads') : path.resolve('uploads'),
    cache: dataDir ? path.join(dataDir, '.cache') : path.resolve('.cache'),
    miniAppDist: path.resolve('../mini-app/dist'),
  },
};

// Telegram web_app tugmalari faqat HTTPS manzil bilan ishlaydi
export function hasMiniApp() {
  return config.miniAppUrl.startsWith('https://');
}
