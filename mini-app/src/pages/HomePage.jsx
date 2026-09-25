import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n } from '../i18n.jsx';
import CategoryChips from '../components/CategoryChips.jsx';

export default function HomePage() {
  const { t, lang } = useI18n();
  const { me, runSearch, openCatalog } = useApp();
  const fileInputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api.categories().then(setCategories).catch(() => {});
  }, [lang]);

  function handleFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) runSearch(api.searchPhoto(file));
  }

  function handleSearch(e) {
    e.preventDefault();
    const text = query.trim();
    if (text.length >= 2) runSearch(api.searchText(text));
  }

  return (
    <div className="page">
      <header className="home-header">
        <div className="home-greeting">{t('greeting', { name: me.firstName || '' })}</div>
        <div className="home-subtitle">{t('subtitle')}</div>
      </header>

      <div className="hero-card">
        <div className="hero-emoji">📸</div>
        <h2>{t('heroTitle')}</h2>
        <p>{t('heroText')}</p>
        <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
          {t('uploadPhoto')}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleFile} />
      </div>

      <form className="search-bar" onSubmit={handleSearch}>
        <input
          className="search-input"
          value={query}
          placeholder={t('searchPlaceholder')}
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
        />
        <button className="search-button" type="submit" disabled={query.trim().length < 2}>
          🔎
        </button>
      </form>

      {categories.length > 0 && (
        <section>
          <h3 className="section-title">{t('popularCategories')}</h3>
          <CategoryChips categories={categories} onChange={openCatalog} withAll={false} />
        </section>
      )}
    </div>
  );
}
