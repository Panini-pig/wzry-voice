import { useMemo, useState } from 'react';
import { usePlayer } from '../store';
import type { Hero } from '../types';
import PosterModal from '../components/PosterModal';

export default function RightRail({ hero, skinId }: { hero: Hero | null; skinId: string }) {
  const [tab, setTab] = useState<'poster' | 'queue'>('poster');
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { queue, index, current, playing, jumpTo } = usePlayer();

  const posterSkins = useMemo(() => hero?.skins.filter((s) => s.posterUrl) ?? [], [hero]);

  const posterIndex = useMemo(() => {
    if (!posterSkins.length) return 0;
    const i = posterSkins.findIndex((s) => s.id === skinId);
    return i >= 0 ? i : 0;
  }, [posterSkins, skinId]);

  const skin = posterSkins[posterIndex];
  const upcoming = queue.slice(index, index + 30);

  return (
    <aside className="d-side">
      <div className="d-side__tabs">
        <button className={tab === 'poster' ? 'd-tab is-on' : 'd-tab'} onClick={() => setTab('poster')}>
          海报
        </button>
        <button className={tab === 'queue' ? 'd-tab is-on' : 'd-tab'} onClick={() => setTab('queue')}>
          队列 <span>{queue.length || ''}</span>
        </button>
      </div>

      {tab === 'poster' &&
        (hero && skin ? (
          <div className="d-poster">
            <button className="d-poster__frame" onClick={() => setLightbox(posterIndex)}>
              <img src={skin.posterUrl!} alt={skin.name} loading="lazy" />
              <span className="d-poster__zoom">点击放大</span>
            </button>
            <div className="d-poster__bar">
              <button
                onClick={() => setLightbox(Math.max(0, posterIndex - 1))}
                disabled={posterIndex === 0}
                aria-label="上一张"
              >
                ‹
              </button>
              <div className="d-poster__meta">
                <p>{skin.name}</p>
                <span>
                  {hero.name} · {posterIndex + 1}/{posterSkins.length}
                </span>
              </div>
              <button
                onClick={() => setLightbox(Math.min(posterSkins.length - 1, posterIndex + 1))}
                disabled={posterIndex === posterSkins.length - 1}
                aria-label="下一张"
              >
                ›
              </button>
            </div>
            <a
              className="d-poster__open"
              href={skin.posterUrl!}
              target="_blank"
              rel="noreferrer"
            >
              查看原图 ↗
            </a>
          </div>
        ) : (
          <div className="d-side__empty">
            <p>从左侧选一位英雄</p>
            <span>这里会显示皮肤海报，点击可全屏查看</span>
          </div>
        ))}

      {tab === 'queue' && (
        <div className="d-queue">
          {!queue.length && (
            <div className="d-side__empty">
              <p>队列是空的</p>
              <span>播放任意一条台词后，这里会显示接下来的内容</span>
            </div>
          )}
          {!!queue.length && (
            <>
              <p className="d-queue__head">
                正在播放 {index + 1} / {queue.length}
              </p>
              <div className="d-queue__list">
                {upcoming.map((v, i) => {
                  const realIndex = index + i;
                  const active = current?.id === v.id;
                  return (
                    <button
                      key={v.id}
                      className={active ? 'd-queue__item is-on' : 'd-queue__item'}
                      onClick={() => jumpTo(realIndex)}
                    >
                      <span className="d-queue__idx">{active && playing ? '▮▮' : realIndex + 1}</span>
                      <span className="d-queue__text">{v.text}</span>
                      <span className="d-queue__skin">{v.skinName ?? ''}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {lightbox !== null && hero && (
        <PosterModal hero={hero} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
    </aside>
  );
}
