import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Pagination from '../components/Pagination.jsx';
import ModelFormModal from '../components/ModelFormModal.jsx';

const PAGE_SIZE = 20;

function formatSize(bytes) {
  return bytes ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : '';
}

export default function ModelsPage({ categories, onChanged }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  function load() {
    setLoading(true);
    setError('');
    api
      .models({ page, pageSize: PAGE_SIZE, search, category })
      .then((res) => {
        setItems(res.items);
        setTotal(res.total);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, [page, search, category]);

  async function handleSubmit(data) {
    if (editing) await api.updateModel(editing.id, data);
    else await api.createModel(data);
    setShowForm(false);
    setEditing(null);
    load();
    onChanged();
  }

  async function handleDelete(model) {
    if (!confirm(`"${model.name}" o'chirilsinmi?`)) return;
    await api.deleteModel(model.id);
    load();
    onChanged();
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Mahsulotlar</h1>
        <button
          className="btn-primary"
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
        >
          + Yangi model
        </button>
      </div>

      <div className="filters">
        <input
          className="search-input"
          placeholder="Nomi yoki 3dsky ID bo'yicha qidirish..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />
        <select
          className="filter-select"
          value={category}
          onChange={(e) => {
            setPage(1);
            setCategory(e.target.value);
          }}
        >
          <option value="">Barcha kategoriyalar</option>
          {categories.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Rasm</th>
              <th>Nomi</th>
              <th>Kategoriya</th>
              <th>Fayl</th>
              <th>Teglar</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-cell">
                  Hech narsa topilmadi
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m.id}>
                  <td>
                    <img className="table-thumb" src={m.previewImageUrl} alt="" loading="lazy" />
                  </td>
                  <td className="name-cell">
                    {m.telegramLink ? (
                      <a href={m.telegramLink} target="_blank" rel="noreferrer">
                        {m.name}
                      </a>
                    ) : (
                      m.name
                    )}
                    {m.externalId && <div className="muted">{m.externalId}</div>}
                  </td>
                  <td>{m.categoryLabel}</td>
                  <td>
                    {m.hasFile ? (
                      <span className="badge badge-ok" title={m.fileNames.join(', ')}>
                        ✓ {formatSize(m.fileSize)}
                      </span>
                    ) : m.sourceLink ? (
                      <span className="badge">havola</span>
                    ) : (
                      <span className="badge badge-warn">yo'q</span>
                    )}
                  </td>
                  <td className="tags-cell">{m.tags.slice(0, 5).join(', ') || '—'}</td>
                  <td className="table-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => {
                        setEditing(m);
                        setShowForm(true);
                      }}
                    >
                      Tahrirlash
                    </button>
                    <button className="btn-danger" onClick={() => handleDelete(m)}>
                      O'chirish
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />

      {showForm && (
        <ModelFormModal
          initial={editing}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}
