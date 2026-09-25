import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.js';
import { useI18n, LANGUAGES } from '../i18n.jsx';

const TYPE_ICONS = { photo: '📷', text: '🔎', similar: '🔁' };
const TYPE_LABELS = { photo: 'typePhoto', text: 'typeText', similar: 'typeSimilar' };

export default function ProfilePage() {
  const { t, lang } = useI18n();
  const { me, changeLanguage, runSearch, showError } = useApp();
  const [history, setHistory] = useState(null);

  useEffect(() => {
    api.history().then(setHistory).catch(showError);
  }, [showError]);

  const fullName = [me.firstName, me.lastName].filter(Boolean).join(' ');

  return (
    <div className="page">
      <div className="profile-header">
        <div className="profile-avatar">{(me.firstName || '?')[0].toUpperCase()}</div>
        <div>
          <div className="profile-name">{fullName}</div>
          {me.username && <div className="profile-username">@{me.username}</div>}
        </div>
      </div>

      <h3 className="section-title">🌐 {t('language')}</h3>
      <div className="language-grid">
        {LANGUAGES.map((language) => (
          <button
            key={language.code}
            className={`language-option ${lang === language.code ? 'active' : ''}`}
            onClick={() => changeLanguage(language.code)}
          >
            <span className="language-flag">{language.flag}</span>
            <span>{language.label}</span>
          </button>
        ))}
      </div>

      <h3 className="section-title">{t('history')}</h3>
      {history === null ? (
        <div className="empty-state">{t('loading')}</div>
      ) : history.length === 0 ? (
        <div className="empty-state">{t('historyEmpty')}</div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <button key={item.id} className="history-item" onClick={() => runSearch(api.getSearch(item.id))}>
              <div className="history-thumb">
                {item.imageUrl ? <img src={item.imageUrl} alt="" /> : item.previews[0] ? <img src={item.previews[0]} alt="" /> : null}
                <span className="history-type">{TYPE_ICONS[item.type]}</span>
              </div>
              <div className="history-info">
                <div className="history-title">{item.queryText || t(TYPE_LABELS[item.type])}</div>
                <div className="history-meta">
                  {t('resultsCount', { count: item.count })} · {new Date(item.createdAt).toLocaleDateString(lang)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
