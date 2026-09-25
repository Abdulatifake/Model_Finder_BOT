export function getTelegram() {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram() {
  const tg = getTelegram();
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.('#ffffff');
  tg.setBackgroundColor?.('#ffffff');
  // Ro'yxatni pastga aylantirganda Mini App tasodifan yopilib qolmasligi uchun
  tg.disableVerticalSwipes?.();
}

export function getTelegramUser() {
  return getTelegram()?.initDataUnsafe?.user ?? null;
}

export function getInitData() {
  return getTelegram()?.initData ?? '';
}

export function haptic(type = 'light') {
  const feedback = getTelegram()?.HapticFeedback;
  if (!feedback) return;
  if (type === 'success' || type === 'error') feedback.notificationOccurred(type);
  else feedback.impactOccurred(type);
}

export function openLink(url) {
  const tg = getTelegram();
  if (tg && /^https:\/\/t\.me\//.test(url)) tg.openTelegramLink(url);
  else if (tg) tg.openLink(url);
  else window.open(url, '_blank', 'noopener');
}

// Telegram'ning tepadagi "orqaga" tugmasi; brauzerda hech narsa qilmaydi
export function showBackButton(onClick) {
  const button = getTelegram()?.BackButton;
  if (!button) return () => {};
  button.onClick(onClick);
  button.show();
  return () => {
    button.offClick(onClick);
    button.hide();
  };
}
