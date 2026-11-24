import { usePlayer } from '../store';

export default function FloatingPlayer() {
  const { current, heroName, playing, toggle, next, prev, progress, duration, rate, setRate } = usePlayer();

  if (!current) return null;

  const ratio = duration ? Math.min(1, progress / duration) : 0;

  return (
    <div className="d-fp">
      <div className="d-fp__top">
        <div className="d-fp__text">
          <p className="d-fp__line" title={current.text}>
            {current.text}
          </p>
          <p className="d-fp__sub">
            {heroName}
            {current.skinName ? ` · ${current.skinName}` : ''}
          </p>
        </div>
        <div className="d-fp__btns">
          <button onClick={prev} aria-label="上一条">
            ⏮
          </button>
          <button className="d-fp__main" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
            {playing ? '❚❚' : '▶'}
          </button>
          <button onClick={next} aria-label="下一条">
            ⏭
          </button>
        </div>
      </div>

      <div className="d-fp__track">
        <div className="d-fp__bar" style={{ width: `${ratio * 100}%` }} />
      </div>

      <div className="d-fp__foot">
        <button onClick={() => setRate(rate === 1 ? 1.25 : rate === 1.25 ? 1.5 : rate === 1.5 ? 2 : 1)}>
          {rate}×
        </button>
        <span>
          {Math.floor(progress)}s / {Math.round(duration)}s
        </span>
      </div>
    </div>
  );
}
