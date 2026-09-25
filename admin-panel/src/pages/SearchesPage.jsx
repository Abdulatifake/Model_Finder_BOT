import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Pagination from '../components/Pagination.jsx';

const PAGE_SIZE = 20;
const POLL_MS = 5000;

const TYPES = {
  photo: '📷 Rasm',
  crop: '🎯 Buyum',
  text: '🔎 Matn',
  similar: "🔁 O'xshash",
};
const LANGUAGES = { uz: "O'zbekcha", ru: 'Русский', en: 'English', ar: 'العربية' };

export default function SearchesPage() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    function load() {
      api
        .searches({ page, pageSize: PAGE_SIZE })
        .then((res) => {
          if (!active) return;
          setItems(res.items);
          setTotal(res.total);
          setError('');
        })
        .catch((err) => active && setError(err.message))
        .finally(() => active && setLoading(false));
    }
    setLoading(true);
    load();
    const interval = setInterval(load, POLL_MS);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [page]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Qidiruvlar</h1>
        <span className="live-badge">● har {POLL_MS / 1000} soniyada yangilanadi</span>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Mijoz</th>
              <th>Til</th>
              <th>Turi</th>
              <th>So'rov</th>
              <th>Natijalar</th>
              <th>Manba</th>
              <th>Sana</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  Yuklanmoqda...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="empty-cell">
                  Hali qidiruvlar yo'q
                </td>
              </tr>
            ) : (
              items.map((s) => (
                <tr key={s.id}>
                  <td>
                    {[s.user.firstName, s.user.lastName].filter(Boolean).join(' ') || '—'}
                    {s.user.username && <div className="muted">@{s.user.username}</div>}
                    {s.user.phone && <div className="muted">{s.user.phone}</div>}
                  </td>
                  <td>{LANGUAGES[s.user.language] ?? '—'}</td>
                  <td>{TYPES[s.type] ?? s.type}</td>
                  <td>
                    {s.imageUrl ? (
                      <a href={s.imageUrl} target="_blank" rel="noreferrer">
                        <img className="table-thumb" src={s.imageUrl} alt="" loading="lazy" />
                      </a>
                    ) : (
                      s.queryText || '—'
                    )}
                  </td>
                  <td>{s.resultsCount}</td>
                  <td>{s.source === 'app' ? 'Mini App' : 'Bot'}</td>
                  <td>{new Date(s.createdAt).toLocaleString('ru-RU')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  );
}
