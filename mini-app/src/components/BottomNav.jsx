import { useI18n } from '../i18n.jsx';

const items = [
  { key: 'home', icon: '🏠', label: 'navHome' },
  { key: 'catalog', icon: '🔍', label: 'navCatalog' },
  { key: 'favorites', icon: '❤️', label: 'navSaved' },
  { key: 'profile', icon: '👤', label: 'navProfile' },
];

export default function BottomNav({ active, onChange }) {
  const { t } = useI18n();
  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.key}
          className={`bottom-nav-item ${active === item.key ? 'active' : ''}`}
          onClick={() => onChange(item.key)}
        >
          <span className="bottom-nav-icon">{item.icon}</span>
          <span className="bottom-nav-label">{t(item.label)}</span>
        </button>
      ))}
    </nav>
  );
}
