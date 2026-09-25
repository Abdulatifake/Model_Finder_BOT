import { getInitData } from './telegram.js';

// Vercel'da: backend'ning to'liq manzili (Render). Lokal ishlashda bo'sh — so'rovlar Vite proksi orqali o'tadi.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const initData = getInitData();
  if (initData) headers['x-telegram-init-data'] = initData;
  if (body) headers['Content-Type'] = 'application/json';

  const res = await fetch(`${API_URL}/api/client${path}`, {
    method,
    headers,
    body: form ?? (body ? JSON.stringify(body) : undefined),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

export const api = {
  me: () => request('/me'),
  setLanguage: (language) => request('/me/language', { method: 'PUT', body: { language } }),
  categories: () => request('/categories'),
  catalog: (category, page) => request(`/catalog?${new URLSearchParams({ ...(category ? { category } : {}), page })}`),
  searchText: (query, page = 1) => request('/search/text', { method: 'POST', body: { query, page } }),
  searchPhoto: (file) => {
    const form = new FormData();
    form.append('photo', file);
    return request('/search/photo', { method: 'POST', form });
  },
  searchObject: (searchId, objectIndex) => request('/search/object', { method: 'POST', body: { searchId, objectIndex } }),
  getSearch: (id) => request(`/search/${id}`),
  similar: (modelId) => request(`/models/${modelId}/similar`, { method: 'POST' }),
  history: () => request('/history'),
  favorites: () => request('/favorites'),
  favoriteIds: () => request('/favorites/ids'),
  toggleFavorite: (modelId) => request('/favorites/toggle', { method: 'POST', body: { modelId } }),
  deliver: (modelId) => request('/deliver', { method: 'POST', body: { modelId } }),
};
