const ADMIN_KEY = import.meta.env.VITE_ADMIN_API_KEY || '';

async function request(path, { method = 'GET', body } = {}) {
  const res = await fetch(`/api/admin${path}`, {
    method,
    headers: {
      'x-admin-key': ADMIN_KEY,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Xatolik: ${res.status}`);
  return data;
}

export const api = {
  stats: () => request('/stats'),
  categories: () => request('/categories'),
  models: ({ page = 1, pageSize = 20, search = '', category = '' } = {}) =>
    request(`/models?${new URLSearchParams({ page, pageSize, search, category })}`),
  createModel: (data) => request('/models', { method: 'POST', body: data }),
  updateModel: (id, data) => request(`/models/${id}`, { method: 'PUT', body: data }),
  deleteModel: (id) => request(`/models/${id}`, { method: 'DELETE' }),
  searches: ({ page = 1, pageSize = 20 } = {}) => request(`/searches?${new URLSearchParams({ page, pageSize })}`),
};
