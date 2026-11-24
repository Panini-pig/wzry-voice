import { useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { fmtDuration, loadVoices } from '../data';
import { usePlayer } from '../store';
import type { Hero, Voice } from '../types';

type Row = { kind: 'group'; title: string; count: number } | { kind: 'voice'; voice: Voice; index: number };

/* ---------------- 首页：英雄墙 ---------------- */
export function DesktopHome({ heroes }: { heroes: Hero[] }) {
  const totalVoices = useMemo(() => heroes.reduce((n, h) => n + h.voiceCount, 0), [heroes]);
  const totalSkins = useMemo(() => heroes.reduce((n, h) => n + h.skinCount, 0), [heroes]);

  return (
    <div className="d-page">
      <header className="d-page__head">
        <div>
          <p className="d-kicker">VOICE ARCHIVE · 全英雄全皮肤</p>
          <h2 className="d-title">英雄图鉴</h2>
          <p className="d-sub">
            {heroes.length} 位英雄 · {totalSkins} 款皮肤 · {totalVoices.toLocaleString()} 条台词
          </p>
        </div>
      </header>

      <div className="d-grid">
        {heroes.map((h) => (
          <a key={h.id} className="d-card" href={`#/hero/${h.id}`}>
            <div className="d-card__img">
              <img src={h.avatarUrl} alt={h.name} loading="lazy" />
              <span className="d-card__badge">{h.voiceCount}</span>
            </div>
            <div className="d-card__meta">
              <span className="d-card__name">{h.name}</span>
              <span className="d-card__role">{h.roles.join(' / ')}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ---------------- 英雄页 ---------------- */
export function DesktopHero({
  hero,
  skinId,
  onSkinChange,
}: {
  hero: Hero;
  skinId: string;
  onSkinChange: (id: string) => void;
}) {
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const { playQueue, current, playing, toggle, isFav, toggleFav } = usePlayer();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVoices(null);
    loadVoices(hero.id).then(setVoices).catch(console.error);
  }, [hero.id]);

  const playable = useMemo(() => (voices ?? []).filter((v) => v.audio), [voices]);

  // 按「皮肤顺序 + 台词序号」排好，保证队列顺序 = 界面顺序
  const ordered = useMemo(() => {
    const order = new Map(hero.skins.map((s, i) => [s.name ?? '', i]));
    return [...playable].sort(
      (a, b) =>
        (order.get(a.skinName ?? '') ?? 99) - (order.get(b.skinName ?? '') ?? 99) ||
        (a.seq ?? 999) - (b.seq ?? 999)
    );
  }, [playable, hero.skins]);

  const flat = useMemo(
    () => (skinId === 'all' ? ordered : ordered.filter((v) => v.skinId === skinId)),
    [ordered, skinId]
  );

  const rows = useMemo<Row[]>(() => {
    if (skinId !== 'all') return flat.map((v, i) => ({ kind: 'voice', voice: v, index: i }));

    const counts = new Map<string, number>();
    flat.forEach((v) => counts.set(v.skinName ?? '其他', (counts.get(v.skinName ?? '其他') ?? 0) + 1));

    const out: Row[] = [];
    let last = '';
    flat.forEach((v, i) => {
      const title = v.skinName ?? '其他';
      if (title !== last) {
        out.push({ kind: 'group', title, count: counts.get(title) ?? 0 });
        last = title;
      }
      out.push({ kind: 'voice', voice: v, index: i });
    });
    return out;
  }, [flat, skinId]);

  const virt = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (i) => (rows[i]?.kind === 'group' ? 38 : 44),
    overscan: 10,
  });

  return (
    <div className="d-hero-page">
      <header className="d-hero-head">
        <img className="d-hero-head__avatar" src={hero.avatarUrl} alt={hero.name} />
        <div className="d-hero-head__info">
          <h2>{hero.name}</h2>
          <p className="d-hero-head__title">{hero.title}</p>
          <p className="d-hero-head__meta">
            {hero.roles.join(' / ')} · {hero.skinCount} 皮肤 · {hero.voiceCount} 条台词
          </p>
        </div>
        <button className="d-playall" onClick={() => playQueue(flat, 0, hero.name)}>
          ▶ 播放全部 <em>{flat.length}</em>
        </button>
      </header>

      <div className="d-skinnav">
        <button className={skinId === 'all' ? 'd-skinchip is-on' : 'd-skinchip'} onClick={() => onSkinChange('all')}>
          全部 <em>{playable.length}</em>
        </button>
        {hero.skins
          .filter((s) => s.voiceCount > 0)
          .map((s) => (
            <button
              key={s.id}
              className={skinId === s.id ? 'd-skinchip is-on' : 'd-skinchip'}
              onClick={() => onSkinChange(s.id)}
            >
              {s.name} <em>{s.voiceCount}</em>
            </button>
          ))}
      </div>

      <div className="d-vlist" ref={scrollRef} data-grouped={skinId === 'all' ? '1' : '0'}>
        <div style={{ height: virt.getTotalSize(), position: 'relative' }}>
          {virt.getVirtualItems().map((vi) => {
            const row = rows[vi.index];
            const style = {
              position: 'absolute' as const,
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${vi.start}px)`,
            };
            if (row.kind === 'group') {
              return (
                <div key={vi.key} className="d-vgroup" style={style}>
                  <span>{row.title}</span>
                  <em>{row.count}</em>
                </div>
              );
            }
            const v = row.voice;
            const active = current?.id === v.id;
            const onPlay = () => (active ? toggle() : playQueue(flat, row.index, hero.name));
            return (
              <div key={vi.key} className={active ? 'd-vrow is-on' : 'd-vrow'} style={style}>
                <button className="d-vrow__play" onClick={onPlay} aria-label="播放">
                  {active && playing ? '❚❚' : '▶'}
                </button>
                <span className="d-vrow__text" onClick={onPlay} title={v.text}>
                  {v.text}
                </span>
                <span className="d-vrow__skin">{v.skinName ?? ''}</span>
                <span className="d-vrow__cat">{v.category}</span>
                <span className="d-vrow__dur">{fmtDuration(v.duration)}</span>
                <button
                  className={isFav(v.id) ? 'd-vrow__fav is-on' : 'd-vrow__fav'}
                  onClick={() => toggleFav(v, hero.id, hero.name)}
                  aria-label="收藏"
                >
                  {isFav(v.id) ? '★' : '☆'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ---------------- 收藏页 ---------------- */
export function DesktopFavorites() {
  const { favs, playQueue, current, playing, toggle, toggleFav } = usePlayer();
  const list = useMemo(() => Object.values(favs), [favs]);
  const voices = useMemo(() => list.map((f) => f.voice), [list]);

  if (!list.length) {
    return (
      <div className="d-page">
        <header className="d-page__head">
          <div>
            <p className="d-kicker">FAVORITES</p>
            <h2 className="d-title">收藏夹</h2>
            <p className="d-sub">还没有收藏。在台词右侧点 ☆，就会出现在这里。</p>
          </div>
        </header>
      </div>
    );
  }

  return (
    <div className="d-page">
      <header className="d-page__head">
        <div>
          <p className="d-kicker">FAVORITES</p>
          <h2 className="d-title">收藏夹</h2>
          <p className="d-sub">{list.length} 条台词</p>
        </div>
        <button className="d-playall" onClick={() => playQueue(voices, 0, '收藏')}>
          ▶ 播放全部 <em>{voices.length}</em>
        </button>
      </header>

      <div className="d-vlist d-vlist--short">
        {list.map((f, i) => {
          const active = current?.id === f.voice.id;
          return (
            <div key={f.voice.id} className={active ? 'd-vrow is-on' : 'd-vrow'}>
              <button
                className="d-vrow__play"
                onClick={() => (active ? toggle() : playQueue(voices, i, '收藏'))}
                aria-label="播放"
              >
                {active && playing ? '❚❚' : '▶'}
              </button>
              <span className="d-vrow__text" onClick={() => (active ? toggle() : playQueue(voices, i, '收藏'))}>
                {f.voice.text}
              </span>
              <span className="d-vrow__skin">{f.heroName}</span>
              <span className="d-vrow__cat">{f.voice.category}</span>
              <span className="d-vrow__dur">{fmtDuration(f.voice.duration)}</span>
              <button
                className="d-vrow__fav is-on"
                onClick={() => toggleFav(f.voice, f.heroId, f.heroName)}
                aria-label="取消收藏"
              >
                ★
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
