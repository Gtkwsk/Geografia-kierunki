export type Lang = 'pl' | 'en';

export type Direction = {
  id: string;
  en: string;
  pl: string;
  namePl: string;
  nameEn: string;
  main: boolean;
  deg: number;
};

export const DIRECTIONS: Direction[] = [
  { id: 'N', en: 'N', pl: 'Pn', namePl: 'północ', nameEn: 'north', main: true, deg: 0 },
  { id: 'NE', en: 'NE', pl: 'Pn-Wsch', namePl: 'północny wschód', nameEn: 'northeast', main: false, deg: 45 },
  { id: 'E', en: 'E', pl: 'Wsch', namePl: 'wschód', nameEn: 'east', main: true, deg: 90 },
  { id: 'SE', en: 'SE', pl: 'Pd-Wsch', namePl: 'południowy wschód', nameEn: 'southeast', main: false, deg: 135 },
  { id: 'S', en: 'S', pl: 'Pd', namePl: 'południe', nameEn: 'south', main: true, deg: 180 },
  { id: 'SW', en: 'SW', pl: 'Pd-Zach', namePl: 'południowy zachód', nameEn: 'southwest', main: false, deg: 225 },
  { id: 'W', en: 'W', pl: 'Zach', namePl: 'zachód', nameEn: 'west', main: true, deg: 270 },
  { id: 'NW', en: 'NW', pl: 'Pn-Zach', namePl: 'północny zachód', nameEn: 'northwest', main: false, deg: 315 },
];

export function abbr(dir: Direction, lang: Lang): string {
  return lang === 'en' ? dir.en : dir.pl;
}

export function name(dir: Direction, lang: Lang): string {
  return lang === 'en' ? dir.nameEn : dir.namePl;
}

export function shuffle<T>(arr: T[]): T[] {
  const t = [...arr];
  for (let i = t.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [t[i], t[j]] = [t[j], t[i]];
  }
  return t;
}

/** Shuffle directions; avoid starting with the same id as `avoidId`. */
export function nextOrder(avoidId?: string): Direction[] {
  const t = shuffle(DIRECTIONS);
  if (avoidId && t[0]?.id === avoidId && t.length > 1) {
    const first = t.shift()!;
    t.push(first);
  }
  return t;
}

export type QuizMode = 'rose-en' | 'rose-pl' | 'pl-to-en' | 'en-to-pl';
export type ModeId = QuizMode | 'pairs';

export const QUIZ_MODES: QuizMode[] = ['rose-en', 'rose-pl', 'pl-to-en', 'en-to-pl'];
