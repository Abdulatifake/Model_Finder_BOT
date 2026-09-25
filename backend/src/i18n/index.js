import uz from './uz.js';
import ru from './ru.js';
import en from './en.js';
import ar from './ar.js';

const dictionaries = { uz, ru, en, ar };

export const LANGUAGES = Object.keys(dictionaries);

export const LANGUAGE_PROMPT = '🌐 Tilni tanlang · Выберите язык · Choose language · اختر اللغة';

export function resolveLanguage(code) {
  const short = String(code || '').toLowerCase().split('-')[0];
  return LANGUAGES.includes(short) ? short : null;
}

export function t(lang, key, params = {}) {
  const dict = dictionaries[lang] || dictionaries.en;
  let text = dict[key] ?? dictionaries.en[key] ?? key;
  for (const [name, value] of Object.entries(params)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export function languageLabel(lang) {
  return `${dictionaries[lang].flag} ${dictionaries[lang].languageName}`;
}

export function categoryLabel(lang, key) {
  const dict = dictionaries[lang] || dictionaries.en;
  return dict.categories[key] ?? dict.categories.other;
}

export function objectLabel(lang, key) {
  const dict = dictionaries[lang] || dictionaries.en;
  return dict.objects[key] ?? key;
}
