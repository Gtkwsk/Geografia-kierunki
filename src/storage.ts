import type { ModeId, QuizMode } from './directions';
import { QUIZ_MODES } from './directions';

const KEY = 'roza-kierunkow-v1';

export type ModeStats = {
  stars: number;
  bestScore: number;
  plays: number;
  bestMoves: number | null;
  bestTimeMs: number | null;
};

export type RankEntry = {
  id: string;
  mode: QuizMode;
  score: number;
  at: number;
};

export type Store = {
  modes: Record<ModeId, ModeStats>;
  mute: boolean;
  ranking: RankEntry[];
};

function emptyStats(): ModeStats {
  return { stars: 0, bestScore: 0, plays: 0, bestMoves: null, bestTimeMs: null };
}

export function defaultStore(): Store {
  return {
    modes: {
      'rose-en': emptyStats(),
      'rose-pl': emptyStats(),
      'pl-to-en': emptyStats(),
      'en-to-pl': emptyStats(),
      pairs: emptyStats(),
    },
    mute: false,
    ranking: [],
  };
}

function normalizeRanking(raw: unknown): RankEntry[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set<string>(QUIZ_MODES);
  const out: RankEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const e = item as Record<string, unknown>;
    if (
      typeof e.score !== 'number' ||
      typeof e.at !== 'number' ||
      typeof e.mode !== 'string' ||
      !allowed.has(e.mode)
    ) {
      continue;
    }
    out.push({
      id: typeof e.id === 'string' ? e.id : String(e.at),
      score: Math.max(0, Math.round(e.score)),
      mode: e.mode as QuizMode,
      at: e.at,
    });
  }
  return top5(out);
}

export function top5(entries: RankEntry[]): RankEntry[] {
  return [...entries].sort((a, b) => b.score - a.score || a.at - b.at).slice(0, 5);
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultStore();
    const parsed = JSON.parse(raw) as Partial<Store>;
    const base = defaultStore();
    base.mute = !!parsed.mute;
    base.ranking = normalizeRanking(parsed.ranking);
    if (parsed.modes) {
      for (const id of [...QUIZ_MODES, 'pairs'] as ModeId[]) {
        const m = parsed.modes[id];
        if (m) base.modes[id] = { ...base.modes[id], ...m };
      }
    }
    return base;
  } catch {
    return defaultStore();
  }
}

export function saveStore(store: Store): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

export function addRank(ranking: RankEntry[], entry: RankEntry): RankEntry[] {
  return top5([...ranking, entry]);
}

export function bestForMode(store: Store, mode: QuizMode): number | null {
  let best: number | null = null;
  for (const r of store.ranking) {
    if (r.mode === mode && (best == null || r.score > best)) best = r.score;
  }
  return best;
}
