import type { Lang, ModeId, QuizMode } from './directions';

export type Strings = {
  title: string;
  subtitle: string;
  training: string;
  timed: string;
  results: string;
  resultsTop5: string;
  resultsBlurb: string;
  cheat: string;
  cheatFull: string;
  mute: string;
  unmute: string;
  back: string;
  playAgain: string;
  backToMenu: string;
  pointsIn60: string;
  top5: string;
  unlimited: string;
  tapOnRose: string;
  polishAbbr: string;
  englishAbbr: string;
  pickEnglish: string;
  pickPolish: string;
  redNeedle: string;
  cheatTip: string;
  mnemonic: string;
  mnemonicHint: string;
  mainDirs: string;
  interDirs: string;
  notebookTip: string;
  moves: (n: number) => string;
  starsOf3: (n: number) => string;
  emptySlot: string;
  pairsComplete: string;
  bestMoves: string;
  modeTitles: Record<ModeId, string>;
  modeBlurbs: Record<QuizMode, string>;
  pairsBlurb: string;
  modeShort: Record<QuizMode, string>;
};

const pl: Strings = {
  title: 'Róża kierunków',
  subtitle:
    'Geografia, klasa 5. Pytań bez limitu. Na czas masz 60 sekund — błąd zabiera punkt.',
  training: 'Trening',
  timed: '60 sekund',
  results: 'Wyniki',
  resultsTop5: 'Wyniki — 5 najlepszych',
  resultsBlurb:
    'Pięć najlepszych wyników z rund na 60 sekund. Dobrze daje punkt, błąd zabiera punkt.',
  cheat: 'Ściąga',
  cheatFull: 'Ściąga — cała róża',
  mute: 'Wycisz',
  unmute: 'Włącz dźwięk',
  back: 'Wróć',
  playAgain: 'Zagraj ponownie',
  backToMenu: 'Do menu',
  pointsIn60: 'punktów w 60 sekund',
  top5: '5 najlepszych',
  unlimited: 'Bez limitu. Błąd zabiera punkt.',
  tapOnRose: 'Wskaż na róży',
  polishAbbr: 'Polski skrót',
  englishAbbr: 'Angielski skrót',
  pickEnglish: 'Wybierz skrót angielski',
  pickPolish: 'Wybierz skrót polski',
  redNeedle: 'Czerwona igła wskazuje północ — zawsze u góry.',
  cheatTip:
    'Północ jest u góry mapy. Dalej, zgodnie ze wskazówkami zegara: wschód, południe, zachód.',
  mnemonic: 'Na Ekranie Siedzi Wrona',
  mnemonicHint: 'N · E · S · W — od góry, w prawo.',
  mainDirs: 'Kierunki główne',
  interDirs: 'Kierunki pośrednie',
  notebookTip:
    'W zeszytach bywa też pn., pd., wsch., zach. — to te same skróty. Azymut liczy się od północy, w prawo.',
  moves: (n) => {
    if (n === 1) return '1 ruch';
    const t = n % 10;
    const h = n % 100;
    if (t >= 2 && t <= 4 && (h < 12 || h > 14)) return `${n} ruchy`;
    return `${n} ruchów`;
  },
  starsOf3: (n) => `${n} z 3 gwiazdek`,
  emptySlot: '—',
  pairsComplete: 'Układanka gotowa!',
  bestMoves: 'Najlepszy wynik',
  modeTitles: {
    'rose-en': 'Róża · angielski',
    'rose-pl': 'Róża · polski',
    'pl-to-en': 'Polski → angielski',
    'en-to-pl': 'Angielski → polski',
    pairs: 'Pary',
  },
  modeBlurbs: {
    'rose-en': 'Pojawia się N albo SE — wskaż na róży.',
    'rose-pl': 'Pojawia się Pn albo Pd-Wsch — wskaż na róży.',
    'pl-to-en': 'Polski skrót u góry, osiem kafelków do wyboru.',
    'en-to-pl': 'Angielski skrót u góry, wybierz polski.',
  },
  pairsBlurb: 'Odkrywaj karty i łącz angielski skrót z polskim.',
  modeShort: {
    'rose-en': 'Róża EN',
    'rose-pl': 'Róża PL',
    'pl-to-en': 'PL → EN',
    'en-to-pl': 'EN → PL',
  },
};

const en: Strings = {
  title: 'Compass rose',
  subtitle:
    'Geography, grade 5. Unlimited questions. Timed rounds are 60 seconds — a mistake costs a point.',
  training: 'Training',
  timed: '60 seconds',
  results: 'Results',
  resultsTop5: 'Results — top 5',
  resultsBlurb:
    'Top five scores from 60-second rounds. A correct answer adds a point; a mistake costs one.',
  cheat: 'Cheat sheet',
  cheatFull: 'Cheat sheet — full rose',
  mute: 'Mute',
  unmute: 'Unmute',
  back: 'Back',
  playAgain: 'Play again',
  backToMenu: 'Back to menu',
  pointsIn60: 'points in 60 seconds',
  top5: 'Top 5',
  unlimited: 'Unlimited. A mistake costs a point.',
  tapOnRose: 'Tap on the rose',
  polishAbbr: 'Polish abbreviation',
  englishAbbr: 'English abbreviation',
  pickEnglish: 'Pick the English abbreviation',
  pickPolish: 'Pick the Polish abbreviation',
  redNeedle: 'The red needle points north — always at the top.',
  cheatTip:
    'North is at the top of the map. Then clockwise: east, south, west.',
  mnemonic: 'Never Eat Soggy Waffles',
  mnemonicHint: 'N · E · S · W — from the top, clockwise.',
  mainDirs: 'Cardinal directions',
  interDirs: 'Intercardinal directions',
  notebookTip:
    'In notes you may also see pn., pd., wsch., zach. — same Polish shortcuts. Azimuth is measured from north, clockwise.',
  moves: (n) => (n === 1 ? '1 move' : `${n} moves`),
  starsOf3: (n) => `${n} of 3 stars`,
  emptySlot: '—',
  pairsComplete: 'All pairs matched!',
  bestMoves: 'Best result',
  modeTitles: {
    'rose-en': 'Rose · English',
    'rose-pl': 'Rose · Polish',
    'pl-to-en': 'Polish → English',
    'en-to-pl': 'English → Polish',
    pairs: 'Pairs',
  },
  modeBlurbs: {
    'rose-en': 'See N or SE — tap it on the rose.',
    'rose-pl': 'See Pn or Pd-Wsch — tap it on the rose.',
    'pl-to-en': 'Polish abbreviation on top, eight English tiles to choose from.',
    'en-to-pl': 'English abbreviation on top, pick the Polish one.',
  },
  pairsBlurb: 'Flip cards and match each English abbreviation with its Polish pair.',
  modeShort: {
    'rose-en': 'Rose EN',
    'rose-pl': 'Rose PL',
    'pl-to-en': 'PL → EN',
    'en-to-pl': 'EN → PL',
  },
};

export const STRINGS: Record<Lang, Strings> = { pl, en };

export function t(lang: Lang): Strings {
  return STRINGS[lang];
}

const LANG_KEY = 'roza-lang';

export function loadLang(): Lang {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === 'en' || v === 'pl') return v;
  } catch {
    /* ignore */
  }
  return 'pl';
}

export function saveLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}
