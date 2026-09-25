import 'dotenv/config';
import path from 'path';

export const config = {
  port: Number(process.env.PORT) || 4000,
  botToken: process.env.BOT_TOKEN,
  channelUsername: (process.env.CHANNEL_USERNAME || 'PROMODELS2028').replace(/^@/, ''),
  miniAppUrl: process.env.MINI_APP_URL || '',
  tunnel: process.env.TUNNEL || '',
  adminApiKey: process.env.ADMIN_API_KEY,
  allowDevBypass: process.env.ALLOW_DEV_BYPASS === 'true',
  paths: {
    models: path.resolve('public/models'),
    uploads: path.resolve('uploads'),
    cache: path.resolve('.cache'),
    miniAppDist: path.resolve('../mini-app/dist'),
  },
};

// Telegram web_app tugmalari faqat HTTPS manzil bilan ishlaydi
export function hasMiniApp() {
  return config.miniAppUrl.startsWith('https://');
}
