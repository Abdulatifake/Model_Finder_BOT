import { useState } from 'react';
import { useI18n } from '../i18n.jsx';

export default function Onboarding({ onFinish }) {
  const { t } = useI18n();
  const slides = t('onboarding');
  const [index, setIndex] = useState(0);
  const isLast = index === slides.length - 1;
  const slide = slides[index];

  return (
    <div className="onboarding">
      <div className="onboarding-slide" key={index}>
        <div className="onboarding-emoji">{slide.emoji}</div>
        <h1>{slide.title}</h1>
        <p>{slide.text}</p>
      </div>

      <div className="onboarding-dots">
        {slides.map((_, i) => (
          <span key={i} className={`dot ${i === index ? 'active' : ''}`} />
        ))}
      </div>

      <button className="btn-primary" onClick={() => (isLast ? onFinish() : setIndex(index + 1))}>
        {isLast ? t('start') : t('next')}
      </button>
    </div>
  );
}
