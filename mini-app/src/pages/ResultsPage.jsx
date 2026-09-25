import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n } from '../i18n.jsx';
import ObjectPhoto from '../components/ObjectPhoto.jsx';
import ProductGrid from '../components/ProductGrid.jsx';

function titleFor(results, t) {
  if (!results) return t('analyzing');
  if (results.type === 'text') return `🔎 «${results.queryText}»`;
  if (results.type === 'similar') return t('resultsSimilar', { name: results.queryText });
  return t('resultsPhoto');
}

export default function ResultsPage({ results, loading, onClose }) {
  const { t } = useI18n();
  const { runSearch, showError } = useApp();
  const [extra, setExtra] = useState({ key: null, items: [], page: 1, hasMore: true, loading: false });

  // Matn qidiruvi uchun "yana ko'rsatish" — natijalar o'zgarganda qo'shimcha sahifalar tozalanadi
  const resultKey = results ? `${results.type}:${results.searchId}:${results.queryText}` : null;
  const more = extra.key === resultKey ? extra : { key: resultKey, items: [], page: 1, hasMore: true, loading: false };
  const items = results ? [...results.items, ...more.items] : [];
  const canLoadMore = results?.type === 'text' && results.hasMore && more.hasMore;

  async function loadMore() {
    setExtra({ ...more, loading: true });
    try {
      const data = await api.searchText(results.queryText, more.page + 1);
      setExtra({ key: resultKey, items: [...more.items, ...data.items], page: more.page + 1, hasMore: data.hasMore, loading: false });
    } catch (err) {
      showError(err);
      setExtra({ ...more, loading: false });
    }
  }

  return (
    <div className="page">
      <div className="page-header-row">
        <button className="btn-back" onClick={onClose}>
          <span className="icon-flip">←</span>
        </button>
        <h1>{titleFor(results, t)}</h1>
      </div>

      {results?.imageUrl && (
        <ObjectPhoto
          imageUrl={results.imageUrl}
          objects={results.objects}
          active={results.activeObject}
          disabled={loading}
          onSelect={(index) => index !== results.activeObject && runSearch(api.searchObject(results.rootId, index))}
        />
      )}

      {loading ? (
        <div className="loading-state">
          <div className="spinner" />
          <span>{t('analyzing')}</span>
        </div>
      ) : (
        <ProductGrid items={items} emptyText={t('noResults')} />
      )}

      {!loading && canLoadMore && (
        <button className="btn-secondary btn-block" disabled={more.loading} onClick={loadMore}>
          {more.loading ? t('loading') : t('loadMore')}
        </button>
      )}
    </div>
  );
}
