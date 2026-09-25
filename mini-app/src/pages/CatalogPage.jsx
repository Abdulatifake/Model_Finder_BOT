import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n } from '../i18n.jsx';
import CategoryChips from '../components/CategoryChips.jsx';
import ProductGrid from '../components/ProductGrid.jsx';

export default function CatalogPage({ initialCategory }) {
  const { t, lang } = useI18n();
  const { showError } = useApp();
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState(initialCategory);
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, [lang]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .catalog(category, page)
      .then((data) => {
        if (cancelled) return;
        setItems((prev) => (page === 1 ? data.items : [...prev, ...data.items]));
        setHasMore(data.hasMore);
      })
      .catch(showError)
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [category, page, lang, showError]);

  function selectCategory(key) {
    setCategory(key);
    setPage(1);
    setItems([]);
  }

  return (
    <div className="page">
      <h1>{t('catalogTitle')}</h1>
      <CategoryChips categories={categories} active={category} onChange={selectCategory} />
      {loading && !items.length ? <div className="empty-state">{t('loading')}</div> : <ProductGrid items={items} emptyText={t('empty')} />}
      {hasMore && (
        <button className="btn-secondary btn-block" disabled={loading} onClick={() => setPage((p) => p + 1)}>
          {loading ? t('loading') : t('loadMore')}
        </button>
      )}
    </div>
  );
}
