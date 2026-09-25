import { config } from '../config/default.js';

const escapeHtml = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function channelPostUrl(messageId) {
  return `https://t.me/${config.channelUsername}/${messageId}`;
}

export function downloadUrl(model) {
  if (model.fileMessageIds?.length) return channelPostUrl(model.fileMessageIds[0]);
  return model.sourceLink || model.telegramLink || null;
}

// Model fayllarini kanaldan foydalanuvchi chatiga nusxalaydi (qayta yuklamasdan, bir zumda).
// Bot kanalda admin bo'lmasa yoki xabar o'chirilgan bo'lsa false qaytadi.
export async function deliverFiles(telegram, chatId, model) {
  if (!model.fileMessageIds?.length) return false;
  const caption = `<b>${escapeHtml(model.name)}</b>\n📢 @${config.channelUsername}`;
  try {
    for (const messageId of model.fileMessageIds) {
      await telegram.copyMessage(chatId, `@${config.channelUsername}`, Number(messageId), {
        caption,
        parse_mode: 'HTML',
      });
    }
    return true;
  } catch (err) {
    console.error(`Fayl yuborilmadi (model #${model.id}):`, err.description || err.message);
    return false;
  }
}
