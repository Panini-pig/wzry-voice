import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { Voice } from './types';

export interface FavEntry {
  voice: Voice;
  heroId: string;
  heroName: string;
}

interface PlayerState {
  current: Voice | null;
  heroName: string;
  queue: Voice[];
  index: number;
  playing: boolean;
  rate: number;
  progress: number;
  duration: number;
  sleepLeft: number | null;
  playQueue: (list: Voice[], index: number, heroName: string) => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (ratio: number) => void;
  setRate: (r: number) => void;
  setSleep: (minutes: number | null) => void;
  favs: Record<string, FavEntry>;
  isFav: (id: string) => boolean;
  toggleFav: (voice: Voice, heroId: string, heroName: string) => void;
}

const Ctx = createContext<PlayerState | null>(null);

const FAV_KEY = 'wzry.favs.v1';

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [current, setCurrent] = useState<Voice | null>(null);
  const [heroName, setHeroName] = useState('');
  const [queue, setQueue] = useState<Voice[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [rate, setRateState] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [sleepLeft, setSleepLeft] = useState<number | null>(null);
  const [favs, setFavs] = useState<Record<string, FavEntry>>(() => {
    try {
      return JSON.parse(localStorage.getItem(FAV_KEY) || '{}');
    } catch {
      return {};
    }
  });

  if (!audioRef.current && typeof window !== 'undefined') {
    const existing = document.getElementById('wzry-audio') as HTMLAudioElement | null;
    const a = existing ?? new Audio();
    if (!existing) {
      a.id = 'wzry-audio';
      a.preload = 'metadata';
      a.style.display = 'none';
      document.body.appendChild(a);
    }
    audioRef.current = a;
  }

  useEffect(() => {
    localStorage.setItem(FAV_KEY, JSON.stringify(favs));
  }, [favs]);

  const playAt = useCallback(
    (list: Voice[], i: number, name: string) => {
      const v = list[i];
      if (!v || !audioRef.current) return;
      if (!v.audio) return;
      setQueue(list);
      setIndex(i);
      setCurrent(v);
      setHeroName(name);
      audioRef.current.src = v.audio;
      audioRef.current.playbackRate = rate;
      void audioRef.current.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    },
    [rate]
  );

  const next = useCallback(() => {
    if (!queue.length) return;
    const n = (index + 1) % queue.length;
    playAt(queue, n, heroName);
  }, [queue, index, playAt, heroName]);

  const prev = useCallback(() => {
    if (!queue.length) return;
    const n = (index - 1 + queue.length) % queue.length;
    playAt(queue, n, heroName);
  }, [queue, index, playAt, heroName]);

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    if (a.paused) {
      void a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      a.pause();
      setPlaying(false);
    }
  }, [current]);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onMeta = () => setDuration(a.duration || 0);
    const onEnd = () => next();
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    a.addEventListener('play', onPlay);
    a.addEventListener('pause', onPause);
    return () => {
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      a.removeEventListener('play', onPlay);
      a.removeEventListener('pause', onPause);
    };
  }, [next]);

  // 锁屏 / 通知栏控制
  useEffect(() => {
    if (!current || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.text.slice(0, 40),
      artist: `${heroName}${current.skinName ? ' · ' + current.skinName : ''}`,
      album: '王者语音库',
    });
    navigator.mediaSession.setActionHandler('play', () => toggle());
    navigator.mediaSession.setActionHandler('pause', () => toggle());
    navigator.mediaSession.setActionHandler('nexttrack', () => next());
    navigator.mediaSession.setActionHandler('previoustrack', () => prev());
  }, [current, heroName, toggle, next, prev]);

  // 定时关闭
  useEffect(() => {
    if (sleepLeft == null) return;
    if (sleepLeft <= 0) {
      audioRef.current?.pause();
      setSleepLeft(null);
      return;
    }
    const t = setTimeout(() => setSleepLeft((s) => (s == null ? null : s - 1)), 1000);
    return () => clearTimeout(t);
  }, [sleepLeft]);

  const seek = useCallback((ratio: number) => {
    const a = audioRef.current;
    if (!a || !Number.isFinite(a.duration)) return;
    a.currentTime = Math.max(0, Math.min(a.duration, a.duration * ratio));
    setProgress(a.currentTime);
  }, []);

  const setRate = useCallback((r: number) => {
    if (audioRef.current) audioRef.current.playbackRate = r;
    setRateState(r);
  }, []);

  const setSleep = useCallback((minutes: number | null) => {
    setSleepLeft(minutes == null ? null : minutes * 60);
  }, []);

  const toggleFav = useCallback((voice: Voice, heroId: string, name: string) => {
    setFavs((prev) => {
      const next = { ...prev };
      if (next[voice.id]) delete next[voice.id];
      else next[voice.id] = { voice, heroId, heroName: name };
      return next;
    });
  }, []);

  const value = useMemo<PlayerState>(
    () => ({
      current,
      heroName,
      queue,
      index,
      playing,
      rate,
      progress,
      duration,
      sleepLeft,
      playQueue: playAt,
      toggle,
      next,
      prev,
      seek,
      setRate,
      setSleep,
      favs,
      isFav: (id: string) => Boolean(favs[id]),
      toggleFav,
    }),
    [current, heroName, queue, index, playing, rate, progress, duration, sleepLeft, playAt, toggle, next, prev, seek, setRate, setSleep, favs, toggleFav]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer 必须在 PlayerProvider 内使用');
  return ctx;
}
