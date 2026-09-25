import { Telegraf } from 'telegraf';
import { config, hasMiniApp } from '../config/default.js';
import { t, LANGUAGES } from '../i18n/index.js';

export const bot = new Telegraf(config.botToken);

function commandsFor(lang) {
  return [
    { command: 'start', description: t(lang, 'cmdStart') },
    { command: 'language', description: t(lang, 'cmdLanguage') },
    { command: 'saved', description: t(lang, 'cmdSaved') },
    { command: 'help', description: t(lang, 'cmdHelp') },
  ];
}

// Buyruqlar va bot tavsifi har bir tilda — Telegram foydalanuvchi tiliga qarab o'zi tanlaydi.
// languageCode bo'sh bo'lsa — qolgan barcha tillar uchun standart (inglizcha) variant.
export async function setupBotProfile() {
  const telegram = bot.telegram;

  for (const languageCode of ['', ...LANGUAGES]) {
    const lang = languageCode || 'en';
    await telegram.setMyCommands(commandsFor(lang), languageCode ? { language_code: languageCode } : {});

    const description = t(lang, 'botDescription');
    if ((await telegram.getMyDescription(languageCode)).description !== description) {
      await telegram.setMyDescription(description, languageCode);
    }
    const shortDescription = t(lang, 'botShortDescription');
    if ((await telegram.getMyShortDescription(languageCode)).short_description !== shortDescription) {
      await telegram.setMyShortDescription(shortDescription, languageCode);
    }
  }

  await setupMenuButton();
}

// Yozish maydoni yonidagi "Model Finder" tugmasi — Mini App'ni ochadi
export async function setupMenuButton() {
  if (!hasMiniApp()) return;
  await bot.telegram.setChatMenuButton({
    menuButton: { type: 'web_app', text: '🔍 Model Finder', web_app: { url: config.miniAppUrl } },
  });
}
