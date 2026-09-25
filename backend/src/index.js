import crypto from 'crypto';
import { config } from './config/default.js';
import { app, setWebhookHandler, WEBHOOK_PATH } from './app.js';
import { bot, setupBotProfile, setupMenuButton } from './core/bot.js';
import { startCloudflareTunnel } from './core/tunnel.js';
import { registerBotRoutes } from './routes/bot.routes.js';
import { warmUpEmbeddings } from './services/embeddingService.js';
import { warmUpDetector } from './services/detectionService.js';
import { t } from './i18n/index.js';

const ALLOWED_UPDATES = ['message', 'callback_query', 'channel_post', 'edited_channel_post'];

// Telegram tunnel orqali lokal Mini App'ni ochishi uchun (serverda kerak emas)
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

// Serverda (Render): Telegram yangilanishlarni HTTPS orqali o'zi yuboradi — uxlab qolish va ikki nusxa muammosi yo'q
async function startWebhook() {
  const secretToken = crypto.createHash('sha256').update(`webhook:${config.botToken}`).digest('hex');
  const handler = await bot.createWebhook({
    domain: config.publicUrl,
    path: WEBHOOK_PATH,
    secret_token: secretToken,
    allowed_updates: ALLOWED_UPDATES,
  });
  setWebhookHandler(handler);
  console.log(`🤖 Telegram bot webhook rejimida: ${config.publicUrl}${WEBHOOK_PATH}`);
}

async function startPolling() {
  // Bot serverda (webhook) ishlab turgan bo'lsa, lokal nusxa uni uzib qo'ymasligi kerak
  const { url } = await bot.telegram.getWebhookInfo();
  if (url && !config.forcePolling) {
    console.warn(
      `⚠️  Bot serverda ishlayapti (${new URL(url).host}) — lokal bot ishga tushirilmadi. API va admin panel lokal ishlaydi.\n` +
        '    Botni yana shu kompyuterda ishlatish uchun backend/.env ga BOT_MODE=polling yozing.'
    );
    return false;
  }

  bot
    .launch({ allowedUpdates: ALLOWED_UPDATES }, () => console.log('🤖 Telegram bot ishga tushdi'))
    .catch((err) => {
      // 409 — shu token bilan boshqa joyda ham bot ishlab turibdi
      console.error(
        err.response?.error_code === 409
          ? '❌ Bot boshqa joyda allaqachon ishlab turibdi (boshqa oynada yoki fonda). Avval uni yoping.'
          : `Bot ishga tushmadi: ${err.description || err.message}`
      );
      process.exit(1);
    });
  process.once('SIGINT', () => bot.stop('SIGINT'));
  process.once('SIGTERM', () => bot.stop('SIGTERM'));
  return true;
}

async function startBot() {
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

  const running = config.publicUrl && !config.forcePolling ? (await startWebhook(), true) : await startPolling();
  if (running) {
    await setupBotProfile().catch((err) => console.error('Bot profilini sozlashda xato:', err.description || err.message));
  }
  return running;
}

// Bot va tunnel faqat port muvaffaqiyatli egallangandan keyin ishga tushadi:
// ikkinchi nusxa ishga tushirilsa, u birinchisining Telegram ulanishini uzib qo'ymaydi
app
  .listen(config.port, () => {
    console.log(`🌐 API: http://localhost:${config.port}`);
    startBot()
      .then((running) => {
        // Tunnel faqat lokal bot uchun: bot serverda ishlayotganda uning Mini App tugmasini almashtirib qo'ymasligi kerak
        if (running && config.tunnel === 'cloudflared') startTunnel();
      })
      .catch((err) => {
        console.error('Bot ishga tushmadi:', err.description || err.message);
        process.exit(1);
      });
  })
  .on('error', (err) => {
    console.error(err.code === 'EADDRINUSE' ? `❌ ${config.port}-port band: Model Finder yoki boshqa dastur uni ishlatyapti.` : err);
    process.exit(1);
  });

// Birinchi foydalanuvchi kutib qolmasligi uchun AI modellar server ishga tushganda yuklanadi
const warmStart = Date.now();
Promise.all([warmUpEmbeddings(), warmUpDetector()])
  .then(() => console.log(`🧠 AI modellar tayyor (${((Date.now() - warmStart) / 1000).toFixed(1)}s)`))
  .catch((err) => console.error('AI modellarni yuklashda xato:', err));
