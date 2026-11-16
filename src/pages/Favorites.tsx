import { useEffect, useMemo, useState } from 'react';
import { fmtDuration } from '../data';
import { usePlayer } from '../store';
import type { Hero } from '../types';

export default function Favorites({ heroes }: { heroes: Hero[] }) {
  const { favs, playQueue, current, playing, toggle, toggleFav } = usePlayer();

  const list = useMemo(() => Object.values(favs), [favs]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof list>();
    for (const f of list) {
      const k = f.heroName;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(f);
    }
    return [...map.entries()];
  }, [list]);

  if (!list.length) {
    return (
      <div className="empty">
        <p className="empty__title">还没有收藏</p>
        <p className="empty__hint">在英雄页点台词右侧的 ☆，就会出现在这里。</p>
      </div>
    );
  }

  const allVoices = list.map((f) => f.voice);

  return (
    <div className="fav-page">
      <header className="page-head">
        <h1>我的收藏</h1>
        <p>{list.length} 条台词</p>
      </header>
      <div className="actions">
        <button className="btn btn--primary" onClick={() => playQueue(allVoices, 0, '收藏')}>
          ▶ 播放全部收藏
        </button>
      </div>

      {grouped.map(([heroName, items]) => (
        <section key={heroName} className="fav-group">
          <h2 className="fav-group__title">{heroName}</h2>
          <ul className="voice-list">
            {items.map((f) => {
              const active = current?.id === f.voice.id;
              const idx = allVoices.findIndex((v) => v.id === f.voice.id);
              return (
                <li key={f.voice.id} className={active ? 'voice is-active' : 'voice'}>
                  <button className="voice__play" onClick={() => (active ? toggle() : playQueue(allVoices, idx, '收藏'))}>
                    {active && playing ? '❚❚' : '▶'}
                  </button>
                  <div className="voice__body" onClick={() => (active ? toggle() : playQueue(allVoices, idx, '收藏'))}>
                    <p className="voice__text">{f.voice.text}</p>
                    <p className="voice__meta">
                      <span className="voice__cat">{f.voice.category}</span>
                      {f.voice.skinName && <span>{f.voice.skinName}</span>}
                      <span>{fmtDuration(f.voice.duration)}</span>
                    </p>
                  </div>
                  <button className="voice__fav is-on" onClick={() => toggleFav(f.voice, f.heroId, f.heroName)}>
                    ★
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
