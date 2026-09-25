import { useCallback, useEffect, useState } from 'react';
import { api, getToken, setUnauthorizedHandler } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ModelsPage from './pages/ModelsPage.jsx';
import SearchesPage from './pages/SearchesPage.jsx';

export default function App() {
  const [authed, setAuthed] = useState(() => Boolean(getToken()));
  const [tab, setTab] = useState('searches');
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    setUnauthorizedHandler(() => setAuthed(false));
  }, []);

  const loadStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    if (!authed) return;
    loadStats();
    api.categories().then(setCategories).catch(() => {});
  }, [authed, tab, loadStats]);

  if (!authed) return <LoginPage onSuccess={() => setAuthed(true)} />;

  return (
    <div className="admin-app">
      <Sidebar
        active={tab}
        onChange={setTab}
        stats={stats}
        onLogout={() => {
          api.logout();
          setAuthed(false);
        }}
      />
      <main className="admin-main">
        {tab === 'searches' ? <SearchesPage /> : <ModelsPage categories={categories} onChanged={loadStats} />}
      </main>
    </div>
  );
}
