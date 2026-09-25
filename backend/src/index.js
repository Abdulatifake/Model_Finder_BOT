import { config } from './config/default.js';
import { app } from './app.js';
import { bot, setupBotProfile, setupMenuButton } from './core/bot.js';
import { startCloudflareTunnel } from './core/tunnel.js';
import { registerBotRoutes } from './routes/bot.routes.js';
import { warmUpEmbeddings } from './services/embeddingService.js';
import { warmUpDetector } from './services/detectionService.js';
import { t } from './i18n/index.js';

const ALREADY_RUNNING = '❌ Model Finder allaqachon ishlab turibdi (boshqa oynada yoki fonda). Avval uni yoping.';

// Telegram Mini App faqat HTTPS orqali ochiladi — lokal serverga tunnel ochiladi
function startTunnel() {
  startCloudflareTunnel(config.port)
    .then(async (url) => {
      // Yangi manzil DNS'da ~15 soniyada tarqaladi — undan oldin foydalanuvchiga berilsa, ochilmay qoladi
      await new Promise((resolve) => setTimeout(resolve, 15_000));
      config.miniAppUrl = url;
      console.log(`🔗 Mini App manzili: ${url}`);
      await setupMenuButton();
    })
    .catch((err) => console.error('Tunnel ochilmadi:', err.message));
}

function startBot() {
  registerBotRoutes(bot);
  bot.catch(async (err, ctx) => {
    // Foydalanuvchi botni bloklagan — javob berib bo'lmaydi, bu oddiy holat
    if (err.response?.error_code === 403) {
      console.warn(`Foydalanuvchi ${ctx.from?.id} botni bloklagan — javob yuborilmadi`);
      return;
    }
    console.error(`Bot xatosi (${ctx.updateType}):`, err);
    if (ctx.chat?.type === 'private') {
      await ctx.reply(t(ctx.state?.lang ?? 'en', 'error')).catch(() => {});
    }
  });

  bot
    .launch({ allowedUpdates: ['message', 'callback_query', 'channel_post', 'edited_channel_post'] }, () => {
      console.log('🤖 Telegram bot ishga tushdi');
      setupBotProfile().catch((err) => console.error('Bot profilini sozlashda xato:', err.description || err.message));
    })
    .catch((err) => {
      // 409 — shu token bilan boshqa joyda ham bot ishlab turibdi
      console.error(err.response?.error_code === 409 ? ALREADY_RUNNING : `Bot ishga tushmadi: ${err.description || err.message}`);
      process.exit(1);
    });

  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
}

// Bot va tunnel faqat port muvaffaqiyatli egallangandan keyin ishga tushadi:
// ikkinchi nusxa ishga tushirilsa, u birinchisining Telegram ulanishini uzib qo'ymaydi
app
  .listen(config.port, () => {
    console.log(`🌐 API: http://localhost:${config.port}`);
    if (config.tunnel === 'cloudflared') startTunnel();
    startBot();
  })
  .on('error', (err) => {
    console.error(err.code === 'EADDRINUSE' ? ALREADY_RUNNING : err);
    process.exit(1);
  });

// Birinchi foydalanuvchi kutib qolmasligi uchun AI modellar server ishga tushganda yuklanadi
const warmStart = Date.now();
Promise.all([warmUpEmbeddings(), warmUpDetector()])
  .then(() => console.log(`🧠 AI modellar tayyor (${((Date.now() - warmStart) / 1000).toFixed(1)}s)`))
  .catch((err) => console.error('AI modellarni yuklashda xato:', err));
