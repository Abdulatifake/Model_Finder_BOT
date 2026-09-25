import * as botController from '../controllers/botController.js';

export function registerBotRoutes(bot) {
  bot.on(['channel_post', 'edited_channel_post'], botController.channelPost);

  bot.use(botController.loadUser);

  bot.start(botController.start);
  bot.command(['language', 'til', 'lang'], botController.language);
  bot.command('help', botController.help);
  bot.command('saved', botController.saved);

  bot.action(/^l:(uz|ru|en|ar)$/, botController.chooseLanguage);
  bot.action(/^n:(\d+):(\d+)$/, botController.navigate);
  bot.action(/^o:(\d+):(-?\d+)$/, botController.selectObject);
  bot.action(/^s:(\d+)$/, botController.similar);
  bot.action(/^f:(\d+)$/, botController.favorite);
  bot.action(/^d:(\d+)$/, botController.download);
  bot.action('x', botController.noop);
  bot.on('callback_query', botController.noop);

  bot.on('photo', botController.photo);
  bot.on('document', botController.document);
  bot.on('text', botController.text);
  bot.on('message', botController.unsupported);
}
