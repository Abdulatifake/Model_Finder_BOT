import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import Sidebar from './components/Sidebar.jsx';
import ModelsPage from './pages/ModelsPage.jsx';
import SearchesPage from './pages/SearchesPage.jsx';

export default function App() {
  const [tab, setTab] = useState('searches');
  const [stats, setStats] = useState(null);
  const [categories, setCategories] = useState([]);

  const loadStats = useCallback(() => {
    api.stats().then(setStats).catch(() => {});
  }, []);

  useEffect(() => {
    loadStats();
    api.categories().then(setCategories).catch(() => {});
  }, [loadStats]);

  useEffect(loadStats, [tab, loadStats]);

  return (
    <div className="admin-app">
      <Sidebar active={tab} onChange={setTab} stats={stats} />
      <main className="admin-main">
        {tab === 'searches' ? <SearchesPage /> : <ModelsPage categories={categories} onChanged={loadStats} />}
      </main>
    </div>
  );
}
