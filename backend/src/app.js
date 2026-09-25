import fs from 'fs';
import express from 'express';
import cors from 'cors';
import { config } from './config/default.js';
import clientRoutes from './routes/client.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { login } from './controllers/adminController.js';
import { telegramAuth, adminAuth } from './middlewares/auth.middleware.js';
import { asyncHandler, errorHandler } from './middlewares/async.middleware.js';

// Prisma'dagi BigInt maydonlar (telegramId, fileSize...) JSON.stringify bilan to'g'ridan-to'g'ri ishlamaydi
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const WEBHOOK_PATH = '/telegram/webhook';
let webhookHandler = null;

// Serverda bot webhook rejimida ishlaydi: Telegram yangilanishlarni shu yo'lga yuboradi
export function setWebhookHandler(handler) {
  webhookHandler = handler;
}

export const app = express();
app.disable('x-powered-by');
// Render (va tunnel) proksisi orqasida req.ip haqiqiy mijoz manzilini ko'rsatishi uchun
app.set('trust proxy', 1);

// Mini App va admin panel Vercel'da (boshqa domenda) — faqat ular backend'ga brauzerdan murojaat qila oladi
app.use(
  cors({
    origin: (origin, callback) => callback(null, !origin || config.allowedOrigins.includes(origin)),
    maxAge: 86400,
  })
);
app.use(express.json({ limit: '100kb' }));

app.post(WEBHOOK_PATH, (req, res, next) => (webhookHandler ? webhookHandler(req, res, next) : res.sendStatus(503)));

app.use('/static/models', express.static(config.paths.models, { maxAge: '30d', immutable: true }));
app.use('/uploads', express.static(config.paths.uploads, { maxAge: '1d' }));

app.use('/api/client', telegramAuth, clientRoutes);
app.post('/api/admin/login', asyncHandler(login));
app.use('/api/admin', adminAuth, adminRoutes);
app.get('/health', (req, res) => res.json({ ok: true }));

// Lokal ishlashda Mini App'ning tayyor build'i ham shu serverdan beriladi (tunnel orqali Telegram ochadi)
if (fs.existsSync(config.paths.miniAppDist)) {
  app.use(express.static(config.paths.miniAppDist));
}

app.use(errorHandler);
