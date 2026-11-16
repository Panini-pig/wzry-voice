import { useEffect, useMemo, useRef, useState } from 'react';
import { loadIndex, loadVoices } from '../data';
import type { IndexRow } from '../data';
import { usePlayer } from '../store';
import type { Hero } from '../types';

export default function SearchOverlay({ heroes, onClose }: { heroes: Hero[]; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState<IndexRow[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { playQueue } = usePlayer();

  useEffect(() => {
    inputRef.current?.focus();
    loadIndex().then(setIndex).catch(console.error);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const heroMap = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);

  const results = useMemo(() => {
    const key = q.trim().toLowerCase();
    if (!key) return { heroes: [], skins: [], lines: [] };

    const hs = heroes
      .filter((h) => h.name.includes(q) || h.slug.includes(key) || h.title.includes(q))
      .slice(0, 12);

    if (!index) return { heroes: hs, skins: [], lines: [] };

    const skins = index.filter((r) => r.t === 's' && r.n.includes(q)).slice(0, 12);
    const lines = index.filter((r) => r.t === 'v' && r.n.includes(q)).slice(0, 40);
    return { heroes: hs, skins, lines };
  }, [q, heroes, index]);

  const playLine = async (row: IndexRow) => {
    if (!row.h) return;
    const voices = await loadVoices(row.h);
    const v = voices.find((x) => x.id === row.id && x.audio);
    if (!v) return;
    const hero = heroMap.get(row.h);
    playQueue([v], 0, hero?.name ?? '');
    location.hash = `#/hero/${row.h}`;
    onClose();
  };

  const empty = !results.heroes.length && !results.skins.length && !results.lines.length;

  return (
    <div className="overlay">
      <div className="overlay__head">
        <input
          ref={inputRef}
          className="overlay__input"
          placeholder="搜索英雄 / 皮肤 / 台词内容"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="overlay__cancel" onClick={onClose}>
          取消
        </button>
      </div>

      <div className="overlay__body">
        {!q && <p className="overlay__hint">输入英雄名、皮肤名，或台词里的任意几个字</p>}
        {!index && q && <p className="overlay__hint">正在载入搜索索引…</p>}

        {!!results.heroes.length && (
          <section className="result-group">
            <h3>英雄</h3>
            {results.heroes.map((h) => (
              <a key={h.id} className="result" href={`#/hero/${h.id}`} onClick={onClose}>
                <img src={h.avatarUrl} alt="" />
                <span>{h.name}</span>
                <em>{h.voiceCount} 条</em>
              </a>
            ))}
          </section>
        )}

        {!!results.skins.length && (
          <section className="result-group">
            <h3>皮肤</h3>
            {results.skins.map((s) => (
              <a key={s.id + s.n} className="result" href={`#/hero/${s.h}`} onClick={onClose}>
                <span>{s.n}</span>
                <em>{heroMap.get(s.h ?? '')?.name ?? ''}</em>
              </a>
            ))}
          </section>
        )}

        {!!results.lines.length && (
          <section className="result-group">
            <h3>台词</h3>
            {results.lines.map((r) => (
              <button key={r.id} className="result result--line" onClick={() => playLine(r)}>
                <span>{r.n}</span>
                <em>{heroMap.get(r.h ?? '')?.name ?? ''}</em>
              </button>
            ))}
          </section>
        )}

        {empty && q && <p className="overlay__hint">没有找到“{q}”</p>}
      </div>
    </div>
  );
}
