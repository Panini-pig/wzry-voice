import { useEffect, useMemo, useState } from 'react';
import { fmtDuration, loadVoices } from '../data';
import { usePlayer } from '../store';
import type { Hero, Voice } from '../types';
import PosterModal from '../components/PosterModal';

export default function HeroPage({
  heroes,
  heroId,
  onBack,
}: {
  heroes: Hero[];
  heroId: string;
  onBack: () => void;
}) {
  const hero = heroes.find((h) => h.id === heroId);
  const [voices, setVoices] = useState<Voice[] | null>(null);
  const [skinId, setSkinId] = useState<string>('all');
  const [posterIndex, setPosterIndex] = useState<number | null>(null);
  const { playQueue, current, playing, toggle, isFav, toggleFav } = usePlayer();

  useEffect(() => {
    setVoices(null);
    setSkinId('all');
    loadVoices(heroId).then(setVoices).catch(console.error);
  }, [heroId]);

  const playable = useMemo(() => (voices ?? []).filter((v) => v.audio), [voices]);

  const filtered = useMemo(() => {
    const list = playable;
    if (skinId === 'all') return list;
    return list.filter((v) => v.skinId === skinId);
  }, [playable, skinId]);

  const skinsWithAudio = useMemo(() => {
    if (!hero) return [];
    return hero.skins.filter((s) => s.voiceCount > 0);
  }, [hero]);

  const groups = useMemo(() => {
    const entries = filtered.map((v, idx) => ({ v, idx }));
    if (skinId !== 'all') return [{ title: null as string | null, items: entries }];

    const order = new Map(skinsWithAudio.map((s, i) => [s.name, i]));
    const bySkin = new Map<string, typeof entries>();
    for (const e of entries) {
      const k = e.v.skinName ?? '其他';
      if (!bySkin.has(k)) bySkin.set(k, []);
      bySkin.get(k)!.push(e);
    }
    return [...bySkin.entries()]
      .sort((a, b) => (order.get(a[0]) ?? 99) - (order.get(b[0]) ?? 99))
      .map(([title, items]) => ({ title: title as string | null, items }));
  }, [filtered, skinId, skinsWithAudio]);

  const posterSkins = useMemo(() => hero?.skins.filter((s) => s.posterUrl) ?? [], [hero]);

  const openPoster = () => {
    const idx = skinId === 'all' ? 0 : Math.max(0, posterSkins.findIndex((s) => s.id === skinId));
    setPosterIndex(idx);
  };

  if (!hero) return <div className="loading">英雄不存在</div>;

  return (
    <div className="hero-page">
      <button className="backbtn" onClick={onBack}>
        ‹ 返回
      </button>

      <header className="hero-profile">
        <img className="hero-profile__avatar" src={hero.avatarUrl} alt={hero.name} />
        <div className="hero-profile__info">
          <h1>{hero.name}</h1>
          <p className="hero-profile__title">{hero.title}</p>
          <p className="hero-profile__meta">
            {hero.roles.join(' / ')} · {hero.skinCount} 皮肤 · {hero.voiceCount} 条台词
          </p>
        </div>
      </header>

      <div className="actions">
        <button className="btn btn--primary" onClick={() => playQueue(filtered, 0, hero.name)}>
          ▶ 播放全部（{filtered.length}）
        </button>
        <button className="btn" onClick={openPoster}>
          看海报
        </button>
      </div>

      <div className="chips chips--scroll">
        <button className={skinId === 'all' ? 'chip is-active' : 'chip'} onClick={() => setSkinId('all')}>
          全部 {playable.length}
        </button>
        {skinsWithAudio.map((s) => (
          <button key={s.id} className={skinId === s.id ? 'chip is-active' : 'chip'} onClick={() => setSkinId(s.id)}>
            {s.name} {s.voiceCount}
          </button>
        ))}
      </div>

      {!voices && <div className="loading">载入台词…</div>}

      {voices &&
        groups.map((g) => (
          <section key={g.title ?? 'all'} className="skin-section">
            {g.title && (
              <h3 className="skin-section__title">
                {g.title}
                <span>{g.items.length}</span>
              </h3>
            )}
            <ul className="voice-list">
              {g.items.map(({ v, idx }) => {
                const active = current?.id === v.id;
                return (
                  <li key={v.id} className={active ? 'voice is-active' : 'voice'}>
                    <button
                      className="voice__play"
                      aria-label={active && playing ? '暂停' : '播放'}
                      onClick={() => (active ? toggle() : playQueue(filtered, idx, hero.name))}
                    >
                      {active && playing ? '❚❚' : '▶'}
                    </button>
                    <div
                      className="voice__body"
                      onClick={() => (active ? toggle() : playQueue(filtered, idx, hero.name))}
                    >
                      <p className="voice__text">{v.text}</p>
                      <p className="voice__meta">
                        <span className="voice__cat">{v.category}</span>
                        {!g.title && v.skinName && <span>{v.skinName}</span>}
                        <span>{fmtDuration(v.duration)}</span>
                      </p>
                    </div>
                    <button
                      className={isFav(v.id) ? 'voice__fav is-on' : 'voice__fav'}
                      onClick={() => toggleFav(v, hero.id, hero.name)}
                      aria-label="收藏"
                    >
                      {isFav(v.id) ? '★' : '☆'}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}

      {posterIndex !== null && (
        <PosterModal
          hero={hero}
          startIndex={posterIndex}
          onClose={() => setPosterIndex(null)}
        />
      )}
    </div>
  );
}
