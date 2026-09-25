import { useI18n } from '../i18n.jsx';

// Foydalanuvchi yuklagan rasm + AI topgan buyumlar ramkalari. Ramka yoki tugmani bosish — faqat o'sha buyum bo'yicha qidiruv.
export default function ObjectPhoto({ imageUrl, objects, active, onSelect, disabled }) {
  const { t } = useI18n();

  return (
    <div className="object-photo">
      <div className="object-photo-frame" dir="ltr">
        <img src={imageUrl} alt="" />
        {objects.map((o) => (
          <button
            key={o.index}
            className={`object-box ${active === o.index ? 'active' : ''}`}
            style={{
              left: `${o.box.xmin * 100}%`,
              top: `${o.box.ymin * 100}%`,
              width: `${(o.box.xmax - o.box.xmin) * 100}%`,
              height: `${(o.box.ymax - o.box.ymin) * 100}%`,
            }}
            disabled={disabled}
            onClick={() => onSelect(o.index)}
          >
            <span className="object-box-label">{o.label}</span>
          </button>
        ))}
      </div>

      {objects.length > 0 && (
        <>
          <div className="object-hint">{t('objectsHint')}</div>
          <div className="chips">
            <button className={`chip ${active === -1 ? 'active' : ''}`} disabled={disabled} onClick={() => onSelect(-1)}>
              🖼 {t('wholePhoto')}
            </button>
            {objects.map((o) => (
              <button
                key={o.index}
                className={`chip ${active === o.index ? 'active' : ''}`}
                disabled={disabled}
                onClick={() => onSelect(o.index)}
              >
                🎯 {o.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
