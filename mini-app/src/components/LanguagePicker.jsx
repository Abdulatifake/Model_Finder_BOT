import { LANGUAGES } from '../i18n.jsx';

export default function LanguagePicker({ onSelect }) {
  return (
    <div className="language-picker">
      <div className="language-picker-icon">🌐</div>
      <h1>Tilni tanlang · Выберите язык</h1>
      <p>Choose language · اختر اللغة</p>
      <div className="language-list">
        {LANGUAGES.map((language) => (
          <button key={language.code} className="language-option" onClick={() => onSelect(language.code)}>
            <span className="language-flag">{language.flag}</span>
            <span>{language.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
