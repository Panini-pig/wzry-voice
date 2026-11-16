import { useMemo, useState } from 'react';
import type { Hero } from '../types';

const ROLE_ORDER = ['战士', '法师', '坦克', '刺客', '射手', '辅助'];

export default function Home({ heroes, onOpenSearch }: { heroes: Hero[]; onOpenSearch: () => void }) {
  const [role, setRole] = useState<string>('全部');

  const roles = useMemo(() => {
    const set = new Set<string>();
    heroes.forEach((h) => h.roles.forEach((r) => set.add(r)));
    return ['全部', ...ROLE_ORDER.filter((r) => set.has(r))];
  }, [heroes]);

  const list = useMemo(
    () => (role === '全部' ? heroes : heroes.filter((h) => h.roles.includes(role))),
    [heroes, role]
  );

  const totalVoices = useMemo(() => heroes.reduce((n, h) => n + h.voiceCount, 0), [heroes]);

  return (
    <div className="home">
      <header className="hero-head">
        <p className="hero-head__kicker">HONOR OF KINGS · VOICE ARCHIVE</p>
        <h1 className="hero-head__title">王者语音库</h1>
        <p className="hero-head__sub">
          {heroes.length} 位英雄 · {heroes.reduce((n, h) => n + h.skinCount, 0)} 款皮肤 ·{' '}
          {totalVoices.toLocaleString()} 条台词
        </p>
        <button className="searchbar" onClick={onOpenSearch}>
          <span className="searchbar__icon">⌕</span>
          <span>搜索英雄 / 皮肤 / 台词</span>
        </button>
      </header>

      <div className="chips">
        {roles.map((r) => (
          <button key={r} className={r === role ? 'chip is-active' : 'chip'} onClick={() => setRole(r)}>
            {r}
          </button>
        ))}
      </div>

      <div className="grid">
        {list.map((h) => (
          <a key={h.id} className="hero-card" href={`#/hero/${h.id}`}>
            <div className="hero-card__img">
              <img src={h.avatarUrl} alt={h.name} loading="lazy" />
            </div>
            <div className="hero-card__meta">
              <span className="hero-card__name">{h.name}</span>
              <span className="hero-card__count">{h.voiceCount}</span>
            </div>
          </a>
        ))}
      </div>

      <footer className="foot">
        <p>素材版权归腾讯《王者荣耀》所有，本站仅供学习交流，不作商用。</p>
      </footer>
    </div>
  );
}
