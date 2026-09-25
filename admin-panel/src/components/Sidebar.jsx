const items = [
  { key: 'searches', icon: '🔎', label: 'Qidiruvlar' },
  { key: 'models', icon: '🗂️', label: 'Mahsulotlar' },
];

const LANGUAGE_NAMES = { uz: "O'zbekcha", ru: 'Русский', en: 'English', ar: 'العربية', '—': 'Tanlanmagan' };

const format = (n) => Number(n).toLocaleString('ru-RU');

export default function Sidebar({ active, onChange, stats }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">🔍 Model Finder</div>
      <nav>
        {items.map((item) => (
          <button
            key={item.key}
            className={`sidebar-item ${active === item.key ? 'active' : ''}`}
            onClick={() => onChange(item.key)}
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {stats && (
        <div className="sidebar-stats">
          <div className="stat-row">
            <span>Modellar</span>
            <b>{format(stats.modelsCount)}</b>
          </div>
          <div className="stat-row">
            <span>Fayli bor</span>
            <b>{format(stats.modelsWithFile)}</b>
          </div>
          <div className="stat-row">
            <span>Foydalanuvchilar</span>
            <b>{format(stats.usersCount)}</b>
          </div>
          <div className="stat-row">
            <span>Bugungi qidiruvlar</span>
            <b>{format(stats.searchesToday)}</b>
          </div>
          <div className="stat-row">
            <span>Jami qidiruvlar</span>
            <b>{format(stats.searchesCount)}</b>
          </div>

          <div className="stat-subtitle">Tillar</div>
          {Object.entries(stats.languages).map(([code, count]) => (
            <div className="stat-row" key={code}>
              <span>{LANGUAGE_NAMES[code] ?? code}</span>
              <b>{format(count)}</b>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
