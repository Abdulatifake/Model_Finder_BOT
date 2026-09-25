import { useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api.js';
import { AppContext } from './context.js';
import { I18nContext, resolveLanguage, translate } from './i18n.jsx';
import { initTelegram, getTelegramUser, haptic, showBackButton } from './telegram.js';
import LanguagePicker from './components/LanguagePicker.jsx';
import Onboarding from './components/Onboarding.jsx';
import BottomNav from './components/BottomNav.jsx';
import ProductSheet from './components/ProductSheet.jsx';
import Toast from './components/Toast.jsx';
import HomePage from './pages/HomePage.jsx';
import CatalogPage from './pages/CatalogPage.jsx';
import ResultsPage from './pages/ResultsPage.jsx';
import FavoritesPage from './pages/FavoritesPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

const ONBOARDING_KEY = 'model_finder_onboarded_v2';

// Ba'zi muhitlarda (maxfiy rejim, cheklangan webview) localStorage ishlamaydi
function readOnboarded() {
  try {
    return localStorage.getItem(ONBOARDING_KEY) === '1';
  } catch {
    return false;
  }
}

function saveOnboarded() {
  try {
    localStorage.setItem(ONBOARDING_KEY, '1');
  } catch {
    // saqlab bo'lmasa, onboarding keyingi safar yana ko'rinadi — xolos
  }
}

export default function App() {
  const [me, setMe] = useState(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [lang, setLang] = useState(() => resolveLanguage(getTelegramUser()?.language_code) ?? 'en');
  const [needsLanguage, setNeedsLanguage] = useState(false);
  const [onboarded, setOnboarded] = useState(readOnboarded);
  const [tab, setTab] = useState('home');
  const [catalogCategory, setCatalogCategory] = useState('');
  const [results, setResults] = useState(null);
  const [resultsLoading, setResultsLoading] = useState(false);
  const [product, setProduct] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set());
  const [toast, setToast] = useState(null);

  const loadProfile = useCallback(() => {
    setLoadFailed(false);
    api
      .me()
      .then((data) => {
        setMe(data);
        setLang(data.language);
        setNeedsLanguage(!data.languageChosen);
      })
      .catch(() => setLoadFailed(true));
    api
      .favoriteIds()
      .then((ids) => setFavorites(new Set(ids)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    initTelegram();
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  useEffect(() => {
    if (product) return showBackButton(() => setProduct(null));
    if (results || resultsLoading) return showBackButton(() => setResults(null));
    return undefined;
  }, [product, results, resultsLoading]);

  const t = useCallback((key, params) => translate(lang, key, params), [lang]);
  const showToast = useCallback((text) => setToast({ text, id: Date.now() }), []);
  const hideToast = useCallback(() => setToast(null), []);

  const showError = useCallback(
    (err) => {
      haptic('error');
      showToast(err?.status === 429 ? err.message : translate(lang, 'errorGeneric'));
    },
    [lang, showToast]
  );

  const runSearch = useCallback(
    async (request) => {
      setProduct(null);
      setResultsLoading(true);
      window.scrollTo(0, 0);
      try {
        setResults(await request);
      } catch (err) {
        showError(err);
      } finally {
        setResultsLoading(false);
      }
    },
    [showError]
  );

  const toggleFavorite = useCallback(
    async (modelId) => {
      haptic('light');
      try {
        const { favorited } = await api.toggleFavorite(modelId);
        setFavorites((prev) => {
          const next = new Set(prev);
          if (favorited) next.add(modelId);
          else next.delete(modelId);
          return next;
        });
      } catch (err) {
        showError(err);
      }
    },
    [showError]
  );

  const changeLanguage = useCallback(
    async (code) => {
      setLang(code);
      setNeedsLanguage(false);
      try {
        await api.setLanguage(code);
      } catch (err) {
        showError(err);
      }
    },
    [showError]
  );

  const openCatalog = useCallback((category) => {
    setCatalogCategory(category);
    setResults(null);
    setTab('catalog');
  }, []);

  const changeTab = useCallback((key) => {
    setResults(null);
    setCatalogCategory('');
    setTab(key);
  }, []);

  const i18n = useMemo(() => ({ lang, t }), [lang, t]);
  const app = useMemo(
    () => ({ me, favorites, toggleFavorite, openProduct: setProduct, runSearch, showToast, showError, changeLanguage, openCatalog }),
    [me, favorites, toggleFavorite, runSearch, showToast, showError, changeLanguage, openCatalog]
  );

  let screen;
  if (loadFailed) {
    screen = (
      <div className="center-screen">
        <p>{t('errorGeneric')}</p>
        <button className="btn-primary" onClick={loadProfile}>
          ↻
        </button>
      </div>
    );
  } else if (!me) {
    screen = (
      <div className="center-screen">
        <div className="spinner" />
      </div>
    );
  } else if (needsLanguage) {
    screen = <LanguagePicker onSelect={changeLanguage} />;
  } else if (!onboarded) {
    screen = (
      <Onboarding
        onFinish={() => {
          saveOnboarded();
          setOnboarded(true);
        }}
      />
    );
  } else {
    const showResults = results || resultsLoading;
    screen = (
      <div className="app">
        <main className="app-content">
          {showResults ? (
            <ResultsPage results={results} loading={resultsLoading} onClose={() => setResults(null)} />
          ) : tab === 'home' ? (
            <HomePage />
          ) : tab === 'catalog' ? (
            <CatalogPage key={catalogCategory} initialCategory={catalogCategory} />
          ) : tab === 'favorites' ? (
            <FavoritesPage />
          ) : (
            <ProfilePage />
          )}
        </main>
        <BottomNav active={tab} onChange={changeTab} />
        {product && <ProductSheet product={product} onClose={() => setProduct(null)} />}
      </div>
    );
  }

  return (
    <I18nContext.Provider value={i18n}>
      <AppContext.Provider value={app}>
        {screen}
        {toast && <Toast key={toast.id} text={toast.text} onDone={hideToast} />}
      </AppContext.Provider>
    </I18nContext.Provider>
  );
}
