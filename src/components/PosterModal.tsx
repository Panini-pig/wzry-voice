import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Hero } from '../types';

export default function PosterModal({
  hero,
  startIndex,
  onClose,
}: {
  hero: Hero;
  startIndex: number;
  onClose: () => void;
}) {
  const skins = hero.skins.filter((s) => s.posterUrl);
  const [index, setIndex] = useState(Math.min(startIndex, Math.max(0, skins.length - 1)));
  const [scale, setScale] = useState(1);
  const [loaded, setLoaded] = useState(false);
  const touch = useRef<{ x: number; y: number; d: number } | null>(null);

  const skin = skins[index];

  useEffect(() => {
    setLoaded(false);
    setScale(1);
  }, [index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIndex((i) => Math.min(skins.length - 1, i + 1));
      if (e.key === 'ArrowLeft') setIndex((i) => Math.max(0, i - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, skins.length]);

  if (!skin) return null;

  const dist = (t: TouchList) =>
    Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

  return createPortal(
    <div
      className="poster"
      onTouchStart={(e) => {
        if (e.touches.length === 2) touch.current = { x: 0, y: 0, d: dist(e.touches) };
        else if (e.touches.length === 1) touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, d: 0 };
      }}
      onTouchMove={(e) => {
        if (e.touches.length === 2 && touch.current?.d) {
          setScale(Math.max(1, Math.min(4, (dist(e.touches) / touch.current.d) * scale)));
        }
      }}
      onTouchEnd={(e) => {
        if (touch.current && touch.current.d === 0 && e.changedTouches.length === 1) {
          const dx = e.changedTouches[0].clientX - touch.current.x;
          if (Math.abs(dx) > 60 && scale === 1) {
            if (dx < 0) setIndex((i) => Math.min(skins.length - 1, i + 1));
            else setIndex((i) => Math.max(0, i - 1));
          }
        }
        touch.current = null;
      }}
    >
      <div className="poster__bar">
        <div>
          <p className="poster__skin">{skin.name}</p>
          <p className="poster__hero">
            {hero.name} · {index + 1}/{skins.length}
          </p>
        </div>
        <button className="poster__close" onClick={onClose}>
          ✕
        </button>
      </div>

      <div className="poster__stage">
        <div className="poster__glow" style={{ backgroundImage: `url(${skin.posterUrl})` }} />
        {!loaded && <div className="poster__skeleton" />}
        <img
          className="poster__img"
          src={skin.posterUrl!}
          alt={skin.name}
          style={{ transform: `scale(${scale})` }}
          onLoad={() => setLoaded(true)}
        />
      </div>

      <div className="poster__nav">
        <button onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          ‹
        </button>
        <span className="poster__dots">
          {skins.map((s, i) => (
            <i key={s.id} className={i === index ? 'is-on' : ''} onClick={() => setIndex(i)} />
          ))}
        </span>
        <button onClick={() => setIndex((i) => Math.min(skins.length - 1, i + 1))} disabled={index === skins.length - 1}>
          ›
        </button>
      </div>
    </div>,
    document.body
  );
}
