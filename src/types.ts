export interface Skin {
  id: string;
  name: string;
  isDefault: boolean;
  isVariant: boolean;
  posterUrl: string | null;
  voiceCount: number;
}

export interface Hero {
  id: string;
  heroId: number;
  ename: number;
  name: string;
  title: string;
  slug: string;
  roles: string[];
  pubTime: string | null;
  isNew: boolean;
  avatarUrl: string;
  voiceCount: number;
  skinCount: number;
  skins: Skin[];
}

export interface Voice {
  id: string;
  heroId: string;
  skinId: string | null;
  skinName: string | null;
  title: string;
  category: string;
  seq: number | null;
  text: string;
  hasText: boolean;
  duration: number | null;
  audio: string | null;
}

export interface HeroWithVoices extends Hero {
  voices: Voice[];
}
