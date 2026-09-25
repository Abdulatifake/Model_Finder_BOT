import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n } from '../i18n.jsx';
import ProductGrid from '../components/ProductGrid.jsx';

export default function FavoritesPage() {
  const { t, lang } = useI18n();
  const { favorites, showError } = useApp();
  const [items, setItems] = useState(null);

  useEffect(() => {
    api.favorites().then(setItems).catch(showError);
  }, [lang, showError]);

  // Yurakcha bosib olib tashlangan modellar ro'yxatdan darhol yo'qoladi
  const visible = items?.filter((item) => favorites.has(item.id)) ?? [];

  return (
    <div className="page">
      <h1>{t('savedTitle')}</h1>
      {items === null ? <div className="empty-state">{t('loading')}</div> : <ProductGrid items={visible} emptyText={t('savedEmpty')} />}
    </div>
  );
}
