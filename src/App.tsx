import { useEffect, useMemo, useState } from 'react';
import { loadHeroes } from './data';
import type { Hero } from './types';
import Home from './pages/Home';
import HeroPage from './pages/HeroPage';
import Favorites from './pages/Favorites';
import PlayerBar from './components/PlayerBar';
import SearchOverlay from './components/SearchOverlay';

export type Route =
  | { name: 'home' }
  | { name: 'hero'; id: string }
  | { name: 'fav' };

function parseHash(): Route {
  const h = location.hash.replace(/^#/, '');
  const [, seg, id] = h.split('/');
  if (seg === 'hero' && id) return { name: 'hero', id };
  if (seg === 'fav') return { name: 'fav' };
  return { name: 'home' };
}

export default function App() {
  const [heroes, setHeroes] = useState<Hero[] | null>(null);
  const [route, setRoute] = useState<Route>(parseHash);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    loadHeroes().then(setHeroes).catch(console.error);
    const onHash = () => {
      setRoute(parseHash());
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = useMemo(
    () => (path: string) => {
      location.hash = path;
    },
    []
  );

  return (
    <div className="app">
      <div className="app__scroll">
        {!heroes && <div className="loading">正在载入英雄数据…</div>}
        {heroes && route.name === 'home' && (
          <Home heroes={heroes} onOpenSearch={() => setSearchOpen(true)} />
        )}
        {heroes && route.name === 'hero' && (
          <HeroPage heroes={heroes} heroId={route.id} onBack={() => go('/')} />
        )}
        {heroes && route.name === 'fav' && <Favorites heroes={heroes} />}
      </div>

      <nav className="tabbar">
        <button className={route.name === 'home' ? 'tabbar__item is-active' : 'tabbar__item'} onClick={() => go('/')}>
          <svg viewBox="0 0 24 24" className="tabbar__icon" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M12 3 4 8v8l8 5 8-5V8l-8-5Z" strokeLinejoin="round" />
            <path d="M12 12 4 8m8 4 8-4m-8 4v9" />
          </svg>
          <span>英雄</span>
        </button>
        <button className="tabbar__item" onClick={() => setSearchOpen(true)}>
          <svg viewBox="0 0 24 24" className="tabbar__icon" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4.5 4.5" strokeLinecap="round" />
          </svg>
          <span>搜索</span>
        </button>
        <button className={route.name === 'fav' ? 'tabbar__item is-active' : 'tabbar__item'} onClick={() => go('/fav')}>
          <svg viewBox="0 0 24 24" className="tabbar__icon" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="m12 4 2.5 5.2 5.7.8-4.1 4 1 5.7-5.1-2.7-5.1 2.7 1-5.7-4.1-4 5.7-.8L12 4Z" strokeLinejoin="round" />
          </svg>
          <span>收藏</span>
        </button>
      </nav>

      <PlayerBar />
      {heroes && searchOpen && <SearchOverlay heroes={heroes} onClose={() => setSearchOpen(false)} />}
    </div>
  );
}
