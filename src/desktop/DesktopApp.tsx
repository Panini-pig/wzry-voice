import { useEffect, useState } from 'react';
import type { Route } from '../App';
import type { Hero } from '../types';
import LeftRail from './LeftRail';
import RightRail from './RightRail';
import FloatingPlayer from './FloatingPlayer';
import { DesktopFavorites, DesktopHero, DesktopHome } from './Center';
import './desktop.css';

export default function DesktopApp({ heroes, route }: { heroes: Hero[]; route: Route }) {
  const activeHero = route.name === 'hero' ? heroes.find((h) => h.id === route.id) ?? null : null;
  const [skinId, setSkinId] = useState('all');

  useEffect(() => {
    setSkinId('all');
  }, [route.name === 'hero' ? route.id : '']);

  return (
    <div className="d-app">
      <LeftRail heroes={heroes} route={route.name} activeHeroId={activeHero?.id} />

      <main className="d-main">
        {route.name === 'home' && <DesktopHome heroes={heroes} />}
        {route.name === 'hero' && activeHero && (
          <DesktopHero hero={activeHero} skinId={skinId} onSkinChange={setSkinId} />
        )}
        {route.name === 'fav' && <DesktopFavorites />}
      </main>

      <RightRail hero={activeHero} skinId={skinId} />
      <FloatingPlayer />
    </div>
  );
}
