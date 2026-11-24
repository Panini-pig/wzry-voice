import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { loadIndex, loadVoices } from '../data';
import type { IndexRow } from '../data';
import { usePlayer } from '../store';
import type { Hero } from '../types';

const ROLES = ['全部', '战士', '法师', '坦克', '刺客', '射手', '辅助'];

export default function LeftRail({
  heroes,
  route,
  activeHeroId,
}: {
  heroes: Hero[];
  route: string;
  activeHeroId?: string;
}) {
  const [tab, setTab] = useState<'heroes' | 'favs'>('heroes');
  const [role, setRole] = useState('全部');
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<IndexRow[] | null>(null);
  const [focused, setFocused] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const { favs, playQueue, jumpTo } = usePlayer();

  useEffect(() => {
    if (!q) return;
    if (!index) loadIndex().then(setIndex).catch(console.error);
  }, [q, index]);

  const filtered = useMemo(
    () => (role === '全部' ? heroes : heroes.filter((h) => h.roles.includes(role))),
    [heroes, role]
  );

  const favList = useMemo(() => Object.values(favs), [favs]);

  const heroVirt = useVirtualizer({
    count: tab === 'heroes' ? filtered.length : favList.length,
    getScrollElement: () => listRef.current,
    estimateSize: () => 54,
    overscan: 8,
  });

  const results = useMemo(() => {
    const key = q.trim();
    if (!key) return null;
    const hs = heroes.filter((h) => h.name.includes(key) || h.slug.includes(key.toLowerCase())).slice(0, 6);
    const lines = (index ?? []).filter((r) => r.t === 'v' && r.n.includes(key)).slice(0, 10);
    const skins = (index ?? []).filter((r) => r.t === 's' && r.n.includes(key)).slice(0, 6);
    return { hs, lines, skins };
  }, [q, heroes, index]);

  const playLine = async (row: IndexRow) => {
    if (!row.h) return;
    const voices = await loadVoices(row.h);
    const v = voices.find((x) => x.id === row.id && x.audio);
    if (!v) return;
    const hero = heroes.find((h) => h.id === row.h);
    playQueue([v], 0, hero?.name ?? '');
    location.hash = `#/hero/${row.h}`;
    setQ('');
    setFocused(false);
  };

  return (
    <aside className="d-rail">
      <div className="d-brand">
        <p className="d-brand__kicker">HONOR OF KINGS</p>
        <h1 className="d-brand__title">王者语音库</h1>
      </div>

      <div className="d-search">
        <span className="d-search__icon">⌕</span>
        <input
          className="d-search__input"
          placeholder="搜索英雄 / 皮肤 / 台词"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
        />
        {q && (
          <button className="d-search__clear" onClick={() => setQ('')}>
            ✕
          </button>
        )}

        {focused && results && (
          <div className="d-results">
            {results.hs.length > 0 && <p className="d-results__head">英雄</p>}
            {results.hs.map((h) => (
              <a key={h.id} className="d-result" href={`#/hero/${h.id}`} onClick={() => setQ('')}>
                <img src={h.avatarUrl} alt="" />
                <span>{h.name}</span>
                <em>{h.voiceCount}</em>
              </a>
            ))}
            {results.skins.length > 0 && <p className="d-results__head">皮肤</p>}
            {results.skins.map((s) => (
              <a key={s.id} className="d-result" href={`#/hero/${s.h}`} onClick={() => setQ('')}>
                <span className="d-result__dot" />
                <span>{s.n}</span>
              </a>
            ))}
            {results.lines.length > 0 && <p className="d-results__head">台词</p>}
            {results.lines.map((r) => (
              <button key={r.id} className="d-result d-result--line" onClick={() => playLine(r)}>
                <span>{r.n}</span>
                <em>{heroes.find((h) => h.id === r.h)?.name ?? ''}</em>
              </button>
            ))}
            {!results.hs.length && !results.lines.length && !results.skins.length && (
              <p className="d-results__empty">没有找到「{q}」</p>
            )}
          </div>
        )}
      </div>

      <div className="d-tabs">
        <button className={tab === 'heroes' ? 'd-tab is-on' : 'd-tab'} onClick={() => setTab('heroes')}>
          英雄
        </button>
        <button className={tab === 'favs' ? 'd-tab is-on' : 'd-tab'} onClick={() => setTab('favs')}>
          收藏 <span>{favList.length || ''}</span>
        </button>
      </div>

      {tab === 'heroes' && (
        <div className="d-chips">
          {ROLES.map((r) => (
            <button key={r} className={r === role ? 'd-chip is-on' : 'd-chip'} onClick={() => setRole(r)}>
              {r}
            </button>
          ))}
        </div>
      )}

      <div className="d-list" ref={listRef}>
        <div style={{ height: heroVirt.getTotalSize(), position: 'relative' }}>
          {heroVirt.getVirtualItems().map((vi) => {
            const h = tab === 'heroes' ? filtered[vi.index] : null;
            const f = tab === 'favs' ? favList[vi.index] : null;

            if (h) {
              return (
                <a
                  key={vi.key}
                  href={`#/hero/${h.id}`}
                  className={activeHeroId === h.id ? 'd-hero is-on' : 'd-hero'}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                >
                  <img src={h.avatarUrl} alt="" />
                  <span className="d-hero__name">{h.name}</span>
                  <span className="d-hero__count">{h.voiceCount}</span>
                </a>
              );
            }

            if (f) {
              const idx = favList.findIndex((x) => x.voice.id === f.voice.id);
              return (
                <button
                  key={vi.key}
                  className="d-fav"
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', transform: `translateY(${vi.start}px)` }}
                  onClick={() => playQueue(favList.map((x) => x.voice), idx, '收藏')}
                >
                  <span className="d-fav__text">{f.voice.text}</span>
                  <span className="d-fav__hero">{f.heroName}</span>
                </button>
              );
            }
            return null;
          })}
        </div>
      </div>

      <div className="d-rail__foot">
        <a href="#/fav" className={route === 'fav' ? 'is-on' : ''}>
          收藏夹
        </a>
        <span>·</span>
        <span>素材版权归腾讯所有</span>
      </div>
    </aside>
  );
}
