import fs from 'fs';
import path from 'path';
import express from 'express';
import { config } from './config/default.js';
import clientRoutes from './routes/client.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { telegramAuth, adminAuth } from './middlewares/auth.middleware.js';
import { errorHandler } from './middlewares/async.middleware.js';

// Prisma'dagi BigInt maydonlar (telegramId, fileSize...) JSON.stringify bilan to'g'ridan-to'g'ri ishlamaydi
BigInt.prototype.toJSON = function () {
  return this.toString();
};

export const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '100kb' }));

app.use('/static', express.static(path.resolve('public'), { maxAge: '7d' }));
app.use('/uploads', express.static(config.paths.uploads, { maxAge: '1d' }));

app.use('/api/client', telegramAuth, clientRoutes);
app.use('/api/admin', adminAuth, adminRoutes);
app.get('/health', (req, res) => res.json({ ok: true }));

// Tunnel orqali Telegram ochadigan Mini App — oldindan build qilingan fayllar (mini-app/dist)
if (fs.existsSync(config.paths.miniAppDist)) {
  app.use(express.static(config.paths.miniAppDist));
} else {
  console.warn("⚠️  mini-app/dist topilmadi — Telegram'da Mini App ochilishi uchun: cd mini-app && npm run build");
}

app.use(errorHandler);
