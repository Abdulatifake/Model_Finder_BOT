// Vercel'da: backend'ning to'liq manzili (Render). Lokal ishlashda bo'sh — so'rovlar Vite proksi orqali o'tadi.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const TOKEN_KEY = 'model_finder_admin_token';

// Ba'zi brauzer rejimlarida localStorage ishlamaydi — u holda har safar parol so'raladi
export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch {
    // saqlab bo'lmasa, sessiya faqat sahifa ochiq turguncha amal qiladi
  }
}

let onUnauthorized = () => {};
export function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function request(path, { method = 'GET', body } = {}) {
  const token = getToken();
  const res = await fetch(`${API_URL}/api/admin${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && path !== '/login') {
    setToken(null);
    onUnauthorized();
  }
  if (!res.ok) throw new Error(data.error || `Xatolik: ${res.status}`);
  return data;
}

export const api = {
  login: async (password) => {
    const { token } = await request('/login', { method: 'POST', body: { password } });
    setToken(token);
  },
  logout: () => setToken(null),
  stats: () => request('/stats'),
  categories: () => request('/categories'),
  models: ({ page = 1, pageSize = 20, search = '', category = '' } = {}) =>
    request(`/models?${new URLSearchParams({ page, pageSize, search, category })}`),
  createModel: (data) => request('/models', { method: 'POST', body: data }),
  updateModel: (id, data) => request(`/models/${id}`, { method: 'PUT', body: data }),
  deleteModel: (id) => request(`/models/${id}`, { method: 'DELETE' }),
  searches: ({ page = 1, pageSize = 20 } = {}) => request(`/searches?${new URLSearchParams({ page, pageSize })}`),
};
