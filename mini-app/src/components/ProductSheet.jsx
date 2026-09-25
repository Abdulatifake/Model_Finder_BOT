import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n } from '../i18n.jsx';
import { haptic, openLink } from '../telegram.js';

function formatSize(bytes) {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return mb >= 1 ? `${mb.toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function ProductSheet({ product, onClose }) {
  const { t } = useI18n();
  const { favorites, toggleFavorite, runSearch, showToast, showError } = useApp();
  const [busy, setBusy] = useState(false);
  const isFavorite = favorites.has(product.id);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  async function handleDownload() {
    if (!product.hasFile) {
      if (product.downloadUrl) openLink(product.downloadUrl);
      return;
    }
    setBusy(true);
    try {
      const result = await api.deliver(product.id);
      if (result.mode === 'file') {
        haptic('success');
        showToast(t('fileSent'));
      } else if (result.url) {
        openLink(result.url);
      }
    } catch (err) {
      showError(err);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="sheet-overlay" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-handle" />
        <img className="sheet-image" src={product.previewImageUrl} alt={product.name} />
        <div className="sheet-body">
          <div className="sheet-meta">
            <span className="sheet-category">{product.categoryLabel}</span>
            {product.similarity != null && (
              <span className="sheet-similarity">🎯 {Math.round(product.similarity * 100)}%</span>
            )}
          </div>
          <h2>{product.name}</h2>
          {product.description && <p className="sheet-description">{product.description}</p>}
          {product.fileNames.length > 0 && (
            <div className="sheet-file" dir="ltr">
              📦 {product.fileNames.join(', ')}
              {product.fileSize ? <span> · {formatSize(product.fileSize)}</span> : null}
            </div>
          )}
          {product.tags.length > 0 && (
            <div className="sheet-tags">
              {product.tags.slice(0, 10).map((tag) => (
                <span key={tag} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="sheet-cta">
          <button className={`btn-icon ${isFavorite ? 'active' : ''}`} onClick={() => toggleFavorite(product.id)}>
            ❤️
          </button>
          <button className="btn-secondary" onClick={() => runSearch(api.similar(product.id))}>
            {t('similar')}
          </button>
          <button className="btn-primary" disabled={busy || (!product.hasFile && !product.downloadUrl)} onClick={handleDownload}>
            {busy ? '...' : product.hasFile ? t('download') : t('openInChannel')}
          </button>
        </div>
      </div>
    </div>
  );
}
