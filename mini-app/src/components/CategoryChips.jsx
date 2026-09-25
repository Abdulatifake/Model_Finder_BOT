import { useI18n } from '../i18n.jsx';

export default function CategoryChips({ categories, active, onChange, withAll = true }) {
  const { t } = useI18n();
  return (
    <div className="chips">
      {withAll && (
        <button className={`chip ${!active ? 'active' : ''}`} onClick={() => onChange('')}>
          {t('all')}
        </button>
      )}
      {categories.map((c) => (
        <button key={c.key} className={`chip ${active === c.key ? 'active' : ''}`} onClick={() => onChange(c.key)}>
          {c.label}
        </button>
      ))}
    </div>
  );
}
