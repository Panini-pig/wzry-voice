import { usePlayer } from '../store';

const RATES = [1, 1.25, 1.5, 2];
const SLEEP = [null, 15, 30, 60];

export default function PlayerBar() {
  const {
    current,
    heroName,
    playing,
    toggle,
    next,
    prev,
    progress,
    duration,
    seek,
    rate,
    setRate,
    sleepLeft,
    setSleep,
  } = usePlayer();

  if (!current) return null;

  const ratio = duration ? Math.min(1, progress / duration) : 0;
  const sleepNow = sleepLeft == null ? null : Math.ceil(sleepLeft / 60);

  const cycleSleep = () => {
    const idx = SLEEP.findIndex((m) => m === sleepNow);
    setSleep(SLEEP[(idx + 1) % SLEEP.length]);
  };

  return (
    <div className="player">
      <div className="player__top">
        <div className="player__text">
          <p className="player__line">{current.text}</p>
          <p className="player__sub">
            {heroName}
            {current.skinName ? ` · ${current.skinName}` : ''}
          </p>
        </div>
        <div className="player__main">
          <button className="player__btn" onClick={prev} aria-label="上一条">
            ⏮
          </button>
          <button className="player__btn player__btn--big" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <button className="player__btn" onClick={next} aria-label="下一条">
            ⏭
          </button>
        </div>
      </div>

      <div
        className="player__progress"
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          seek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
        }}
      >
        <div className="player__bar" style={{ width: `${ratio * 100}%` }} />
      </div>

      <div className="player__extras">
        <button className="player__chip" onClick={() => setRate(RATES[(RATES.indexOf(rate) + 1) % RATES.length])}>
          {rate}×
        </button>
        <button className={sleepNow ? 'player__chip is-on' : 'player__chip'} onClick={cycleSleep}>
          {sleepNow ? `定时 ${sleepNow}′` : '定时'}
        </button>
        <span className="player__time">
          {duration ? `${Math.floor(progress)}s / ${Math.round(duration)}s` : ''}
        </span>
      </div>
    </div>
  );
}
