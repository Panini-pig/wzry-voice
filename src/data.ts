import type { Hero, Voice } from './types';

const BASE = import.meta.env.BASE_URL;

const cache = new Map<string, unknown>();

async function getJSON<T>(path: string): Promise<T> {
  if (cache.has(path)) return cache.get(path) as T;
  const res = await fetch(`${BASE}data/${path}`);
  if (!res.ok) throw new Error(`加载失败 ${path}`);
  const json = (await res.json()) as T;
  cache.set(path, json);
  return json;
}

export const loadHeroes = () => getJSON<Hero[]>('heroes.json');
export const loadVoices = (heroId: string) => getJSON<Voice[]>(`voices/${heroId}.json`);

export interface IndexRow {
  t: 'h' | 's' | 'v';
  id: string;
  h?: string;
  n: string;
  p?: string;
  s?: string;
  a?: number;
}

export const loadIndex = () => getJSON<IndexRow[]>('index.json');

export const heroById = (heroes: Hero[], id: string) => heroes.find((h) => h.id === id);

export const fmtDuration = (s: number | null | undefined) => {
  if (!s || !Number.isFinite(s)) return '';
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return m > 0 ? `${m}:${String(sec).padStart(2, '0')}` : `${sec}"`;
};
