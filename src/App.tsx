import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  Compass,
  LayoutGrid,
  Star,
  Timer,
  Trophy,
} from 'lucide-react';
import { beep, setMuted as setAudioMuted } from './audio';
import { CompassRose, MiniNeedle } from './components/CompassRose';
import { Header, Shell } from './components/Shell';
import {
  DIRECTIONS,
  abbr,
  name,
  nextOrder,
  shuffle,
  type Direction,
  type Lang,
  type QuizMode,
} from './directions';
import { loadLang, saveLang, t } from './i18n';
import {
  addRank,
  bestForMode,
  loadStore,
  saveStore,
  type RankEntry,
  type Store,
} from './storage';

type View =
  | { name: 'home' }
  | { name: 'quiz'; mode: QuizMode; timed: boolean }
  | { name: 'pairs' }
  | { name: 'rank' }
  | { name: 'cheat' };

type QuizState = {
  order: Direction[];
  index: number;
  phase: 'ask' | 'feedback' | 'done';
  picked: string | null;
  ok: boolean;
  score: number;
  lastGain: number;
};

function freshQuiz(): QuizState {
  return {
    order: nextOrder(),
    index: 0,
    phase: 'ask',
    picked: null,
    ok: false,
    score: 0,
    lastGain: 0,
  };
}

function reduceQuiz(state: QuizState, action: { type: 'pick'; id: string } | { type: 'next' } | { type: 'done' }): QuizState {
  if (action.type === 'done') {
    return { ...state, phase: 'done' };
  }
  if (action.type === 'pick') {
    if (state.phase !== 'ask') return state;
    const cur = state.order[state.index];
    if (!cur) return state;
    const ok = action.id === cur.id;
    const gain = ok ? 1 : state.score > 0 ? -1 : 0;
    return {
      ...state,
      phase: 'feedback',
      picked: action.id,
      ok,
      score: state.score + gain,
      lastGain: gain,
    };
  }
  if (state.phase !== 'feedback') return state;
  const cur = state.order[state.index];
  let order = state.order;
  let index = state.index + 1;
  if (index >= order.length) {
    order = order.concat(nextOrder(cur?.id));
  }
  return {
    ...state,
    order,
    index,
    phase: 'ask',
    picked: null,
    ok: false,
    lastGain: 0,
  };
}

function starsFromMoves(moves: number): number {
  return moves <= 12 ? 3 : moves <= 20 ? 2 : 1;
}

function Stars({
  value,
  tone = 'ink',
  pop = false,
  label,
}: {
  value: number;
  tone?: 'ink' | 'parchment';
  pop?: boolean;
  label: string;
}) {
  const empty = tone === 'ink' ? 'text-ink/25' : 'text-parchment/35';
  return (
    <span className="flex gap-0.5" aria-label={label}>
      {[0, 1, 2].map((i) => (
        <Star
          key={i}
          aria-hidden
          strokeWidth={2.2}
          className={`size-4 ${pop ? 'star-pop' : ''} ${
            i < value ? 'fill-brass text-brass' : `fill-transparent ${empty}`
          }`}
        />
      ))}
    </span>
  );
}

function PromptCard({
  kicker,
  value,
  hint,
  gain,
}: {
  kicker: string;
  value: string;
  hint: string;
  gain: number;
}) {
  return (
    <div className="relative mt-3 rounded-3xl bg-parchment px-4 py-3 text-center text-ink">
      <p className="text-xs font-extrabold tracking-widest text-ink/55 uppercase">
        {kicker}
      </p>
      <p className="font-display text-5xl leading-none font-bold tracking-tight">
        {value}
      </p>
      <p className="pt-1 text-sm font-bold text-ink/70">{hint}</p>
      {gain !== 0 ? (
        <span
          className={`animate-float pointer-events-none absolute top-2 left-4 font-display text-xl font-bold ${
            gain > 0 ? 'text-moss' : 'text-brick'
          }`}
        >
          {gain > 0 ? '+1' : '−1'}
        </span>
      ) : null}
    </div>
  );
}

function RankList({
  entries,
  highlightAt,
  modeLabels,
  empty,
}: {
  entries: RankEntry[];
  highlightAt?: number | null;
  modeLabels: Record<QuizMode, string>;
  empty: string;
}) {
  const rows = Array.from({ length: 5 }, (_, i) => entries[i] ?? null);
  return (
    <ol className="space-y-1">
      {rows.map((e, i) => {
        const hi = e != null && highlightAt != null && e.at === highlightAt;
        return (
          <li
            key={e?.id ?? `empty-${i}`}
            className={`flex items-center gap-3 rounded-xl px-3 py-2 ${
              hi ? 'bg-brass text-ink' : 'bg-ink/5 text-ink'
            }`}
          >
            <span className="font-display w-6 text-lg font-bold">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-sm font-extrabold">
              {e ? modeLabels[e.mode] : empty}
            </span>
            <span className="font-display text-lg font-bold">
              {e ? e.score : ''}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

const TIMED_SECS = 60;

function QuizView({
  mode,
  timed,
  lang,
  store,
  onToggleMute,
  onBack,
  onComplete,
}: {
  mode: QuizMode;
  timed: boolean;
  lang: Lang;
  store: Store;
  onToggleMute: () => void;
  onBack: () => void;
  onComplete: (result: { score: number; at: number }) => void;
}) {
  const s = t(lang);
  const [state, setState] = useState(freshQuiz);
  const [left, setLeft] = useState(TIMED_SECS);
  const [highlightAt, setHighlightAt] = useState<number | null>(null);
  const finished = useRef(false);
  const isRose = mode === 'rose-en' || mode === 'rose-pl';
  const feedbackTimer = useRef<number | null>(null);

  const finish = useCallback(
    (score: number) => {
      if (finished.current) return;
      finished.current = true;
      const at = Date.now();
      setHighlightAt(at);
      onComplete({ score, at });
      setState((st) => ({ ...st, phase: 'done', score }));
    },
    [onComplete],
  );

  useEffect(() => {
    if (!timed || state.phase === 'done') return;
    if (left <= 0) {
      finish(state.score);
      return;
    }
    const id = window.setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => window.clearTimeout(id);
  }, [timed, left, state.phase, state.score, finish]);

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    };
  }, []);

  function pick(id: string) {
    if (state.phase !== 'ask' || finished.current) return;
    setState((st) => {
      const next = reduceQuiz(st, { type: 'pick', id });
      beep(next.ok ? 'ok' : 'no');
      return next;
    });
    if (feedbackTimer.current) window.clearTimeout(feedbackTimer.current);
    feedbackTimer.current = window.setTimeout(() => {
      setState((st) => reduceQuiz(st, { type: 'next' }));
    }, 650);
  }

  function replay() {
    finished.current = false;
    setHighlightAt(null);
    setLeft(TIMED_SECS);
    setState(freshQuiz());
  }

  if (state.phase === 'done') {
    return (
      <Shell>
        <Header
          title={s.results}
          muted={store.mute}
          onToggleMute={onToggleMute}
          strings={s}
          onBack={onBack}
        />
        <div className="mt-2 rounded-3xl bg-parchment px-5 py-6 text-center text-ink">
          <p className="text-xs font-extrabold tracking-widest text-ink/50 uppercase">
            {s.modeTitles[mode]}
          </p>
          <p className="font-display mt-2 text-6xl leading-none font-bold">
            {state.score}
          </p>
          <p className="mt-1 text-sm font-bold text-ink/60">{s.pointsIn60}</p>
          <h3 className="mt-5 mb-2 text-left text-xs font-extrabold tracking-widest text-ink/50 uppercase">
            {s.top5}
          </h3>
          <RankList
            entries={store.ranking}
            highlightAt={highlightAt}
            modeLabels={s.modeShort}
            empty={s.emptySlot}
          />
        </div>
        <button
          type="button"
          onClick={replay}
          className="mt-3 flex min-h-12 items-center justify-center rounded-2xl bg-brass font-extrabold text-ink"
        >
          {s.playAgain}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 flex min-h-12 items-center justify-center rounded-2xl bg-parchment/10 font-extrabold text-parchment"
        >
          {s.backToMenu}
        </button>
      </Shell>
    );
  }

  const current = state.order[state.index]!;
  // Learning content: rose-pl / en-to-pl always drill Polish abbreviations.
  const promptValue =
    mode === 'rose-en'
      ? current.en
      : mode === 'rose-pl'
        ? current.pl
        : mode === 'pl-to-en'
          ? current.pl
          : current.en;

  const kicker = isRose
    ? s.tapOnRose
    : mode === 'pl-to-en'
      ? s.polishAbbr
      : s.englishAbbr;

  const hint = isRose
    ? name(current, lang)
    : mode === 'pl-to-en'
      ? s.pickEnglish
      : s.pickPolish;

  const tileLabels =
    mode === 'pl-to-en'
      ? DIRECTIONS.map((d) => ({ id: d.id, label: d.en }))
      : DIRECTIONS.map((d) => ({ id: d.id, label: d.pl }));

  return (
    <Shell fit>
      <Header
        title={s.modeTitles[mode]}
        muted={store.mute}
        onToggleMute={onToggleMute}
        strings={s}
        onBack={onBack}
        aside={
          timed ? (
            <span className="font-display mr-1 text-lg font-bold text-brass tabular-nums">
              {left}s
            </span>
          ) : (
            <span className="mr-1 font-display text-lg font-bold tabular-nums">
              {state.score}
            </span>
          )
        }
      />
      {timed ? (
        <p className="pb-1 text-xs font-bold text-parchment/60">
          {left}s · {state.score} {lang === 'pl' ? 'pkt' : 'pts'}
        </p>
      ) : (
        <p className="pb-1 text-xs font-bold text-parchment/60">{s.unlimited}</p>
      )}
      <PromptCard
        kicker={kicker}
        value={promptValue}
        hint={hint}
        gain={state.phase === 'feedback' ? state.lastGain : 0}
      />
      <div className="flex min-h-0 flex-1 flex-col py-2">
        {isRose ? (
          <div
            className={`m-auto w-full max-w-sm ${
              state.phase === 'feedback' && state.ok ? 'animate-pop' : ''
            } ${state.phase === 'feedback' && !state.ok ? 'animate-shake' : ''}`}
          >
            <CompassRose
              lang={lang}
              correctId={state.phase === 'feedback' ? current.id : null}
              wrongId={
                state.phase === 'feedback' && !state.ok ? state.picked : null
              }
              labelLang={
                state.phase === 'feedback'
                  ? mode === 'rose-pl'
                    ? 'pl'
                    : 'en'
                  : 'none'
              }
              disabled={state.phase !== 'ask'}
              onPick={pick}
            />
            <p className="pt-1 text-center text-xs text-parchment/70">
              {s.redNeedle}
            </p>
          </div>
        ) : (
          <div
            className={`m-auto grid w-full max-w-sm grid-cols-4 gap-2 ${
              state.phase === 'feedback' && state.ok ? 'animate-pop' : ''
            } ${state.phase === 'feedback' && !state.ok ? 'animate-shake' : ''}`}
          >
            {tileLabels.map((tile) => {
              const isCorrect =
                state.phase === 'feedback' && tile.id === current.id;
              const isWrong =
                state.phase === 'feedback' &&
                !state.ok &&
                tile.id === state.picked;
              return (
                <button
                  key={tile.id}
                  type="button"
                  disabled={state.phase !== 'ask'}
                  onClick={() => pick(tile.id)}
                  className={`font-display min-h-14 rounded-2xl text-sm font-bold ${
                    isCorrect
                      ? 'bg-moss text-parchment'
                      : isWrong
                        ? 'bg-brick text-parchment'
                        : 'bg-parchment text-ink active:opacity-90'
                  }`}
                >
                  {tile.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Shell>
  );
}

type MemCard = {
  key: string;
  dirId: string;
  side: 'en' | 'pl';
  label: string;
};

function makePairsDeck(): MemCard[] {
  return shuffle(
    DIRECTIONS.flatMap((d) => [
      { key: `${d.id}-en`, dirId: d.id, side: 'en' as const, label: d.en },
      { key: `${d.id}-pl`, dirId: d.id, side: 'pl' as const, label: d.pl },
    ]),
  );
}

function PairsView({
  lang,
  store,
  onToggleMute,
  onBack,
  onComplete,
}: {
  lang: Lang;
  store: Store;
  onToggleMute: () => void;
  onBack: () => void;
  onComplete: (result: { moves: number; timeMs: number; stars: number }) => void;
}) {
  const s = t(lang);
  const [deck, setDeck] = useState(makePairsDeck);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [moves, setMoves] = useState(0);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [stars, setStars] = useState(0);
  const startedAt = useRef<number | null>(null);
  const endedAt = useRef<number | null>(null);
  const reported = useRef(false);
  const lock = useRef(false);

  useEffect(() => {
    if (matched.length === deck.length && !reported.current && startedAt.current) {
      reported.current = true;
      const end = Date.now();
      endedAt.current = end;
      const st = starsFromMoves(moves);
      setStars(st);
      setDone(true);
      beep('win');
      onComplete({ moves, timeMs: end - startedAt.current, stars: st });
    }
  }, [matched.length, deck.length, moves, onComplete]);

  function reset() {
    lock.current = false;
    reported.current = false;
    startedAt.current = null;
    endedAt.current = null;
    setDeck(makePairsDeck());
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setBusy(false);
    setDone(false);
    setStars(0);
  }

  function flip(key: string) {
    if (busy || lock.current || done) return;
    if (flipped.includes(key) || matched.includes(key)) return;
    if (!startedAt.current) startedAt.current = Date.now();
    beep('flip');
    const next = [...flipped, key];
    setFlipped(next);
    if (next.length < 2) return;
    setMoves((m) => m + 1);
    setBusy(true);
    lock.current = true;
    const [a, b] = next;
    const ca = deck.find((c) => c.key === a)!;
    const cb = deck.find((c) => c.key === b)!;
    const ok = ca.dirId === cb.dirId && ca.side !== cb.side;
    window.setTimeout(() => {
      if (ok) {
        beep('ok');
        setMatched((m) => [...m, a, b]);
      } else {
        beep('no');
      }
      setFlipped([]);
      setBusy(false);
      lock.current = false;
    }, ok ? 320 : 700);
  }

  if (done) {
    return (
      <Shell>
        <Header
          title={s.modeTitles.pairs}
          muted={store.mute}
          onToggleMute={onToggleMute}
          strings={s}
          onBack={onBack}
        />
        <div className="mt-2 rounded-3xl bg-parchment px-5 py-6 text-center text-ink">
          <p className="text-sm font-extrabold text-ink/60">{s.pairsComplete}</p>
          <div className="mt-3 flex justify-center">
            <Stars value={stars} pop label={s.starsOf3(stars)} />
          </div>
          <p className="font-display mt-3 text-3xl font-bold">{s.moves(moves)}</p>
          {store.modes.pairs.bestMoves != null ? (
            <p className="mt-2 text-sm font-bold text-ink/55">
              {s.bestMoves}: {s.moves(store.modes.pairs.bestMoves)}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={reset}
          className="mt-3 flex min-h-12 items-center justify-center rounded-2xl bg-brass font-extrabold text-ink"
        >
          {s.playAgain}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="mt-2 flex min-h-12 items-center justify-center rounded-2xl bg-parchment/10 font-extrabold text-parchment"
        >
          {s.backToMenu}
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header
        title={s.modeTitles.pairs}
        muted={store.mute}
        onToggleMute={onToggleMute}
        strings={s}
        onBack={onBack}
        aside={
          <span className="mr-1 text-sm font-extrabold tabular-nums">
            {s.moves(moves)}
          </span>
        }
      />
      <div className="grid grid-cols-4 gap-2 pt-1">
        {deck.map((card) => {
          const open = flipped.includes(card.key) || matched.includes(card.key);
          return (
            <button
              key={card.key}
              type="button"
              onClick={() => flip(card.key)}
              className="relative h-20 perspective-[600px]"
              aria-label={open ? card.label : '…'}
            >
              <div className={`mem-inner ${open ? 'flipped' : ''}`}>
                <div className="mem-face bg-ink text-brass ring-1 ring-brass/40">
                  <LayoutGrid className="size-5 opacity-70" aria-hidden />
                </div>
                <div
                  className={`mem-face back font-display text-lg font-bold ${
                    matched.includes(card.key)
                      ? 'bg-moss text-parchment'
                      : 'bg-parchment text-ink'
                  }`}
                >
                  {card.label}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Shell>
  );
}

function CheatView({
  lang,
  store,
  onToggleMute,
  onBack,
}: {
  lang: Lang;
  store: Store;
  onToggleMute: () => void;
  onBack: () => void;
}) {
  const s = t(lang);
  const main = DIRECTIONS.filter((d) => d.main);
  const inter = DIRECTIONS.filter((d) => !d.main);

  function DirSection({ title, rows }: { title: string; rows: Direction[] }) {
    return (
      <section className="mt-3 rounded-3xl bg-parchment px-3 py-2 text-ink">
        <h3 className="px-1 pt-1 text-xs font-extrabold tracking-widest text-ink/50 uppercase">
          {title}
        </h3>
        <ul>
          {rows.map((d, i) => (
            <li
              key={d.id}
              className={`flex items-center gap-3 px-3 py-2.5 ${
                i > 0 ? 'border-t border-ink/10' : ''
              }`}
            >
              <MiniNeedle deg={d.deg} />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-extrabold">{name(d, lang)}</span>
                <span className="text-xs font-bold text-ink/55">
                  {lang === 'pl' ? 'azymut' : 'azimuth'} {d.deg}°
                </span>
              </span>
              <span className="text-right">
                <span className="font-display block text-lg leading-none font-bold">
                  {abbr(d, lang)}
                </span>
                <span className="block text-xs font-extrabold text-ink/55">
                  {lang === 'pl' ? d.en : d.pl}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <Shell>
      <Header
        title={s.cheat}
        muted={store.mute}
        onToggleMute={onToggleMute}
        strings={s}
        onBack={onBack}
      />
      <div className="mx-auto w-full max-w-[20rem]">
        <CompassRose legend lang={lang} ariaLabel={s.title} />
      </div>
      <p className="mt-2 text-center text-sm leading-snug font-bold text-parchment/75">
        {s.cheatTip}
      </p>
      <div className="mt-3 rounded-3xl bg-parchment px-4 py-4 text-center text-ink">
        <span className="text-xs font-extrabold tracking-widest text-ink/50 uppercase">
          {lang === 'pl' ? 'Zapamiętaj' : 'Mnemonic'}
        </span>
        <span className="font-display mt-1 block text-2xl leading-tight font-bold">
          {s.mnemonic}
        </span>
        <span className="mt-1 block text-sm font-bold text-ink/70">
          {s.mnemonicHint}
        </span>
      </div>
      <DirSection title={s.mainDirs} rows={main} />
      <DirSection title={s.interDirs} rows={inter} />
      <p className="mt-3 pb-2 text-center text-xs leading-snug font-bold text-parchment/65">
        {s.notebookTip}
      </p>
    </Shell>
  );
}

const MODE_CARDS: { id: QuizMode; mark: 'icon' | string }[] = [
  { id: 'rose-en', mark: 'icon' },
  { id: 'rose-pl', mark: 'icon' },
  { id: 'pl-to-en', mark: 'Pn' },
  { id: 'en-to-pl', mark: 'NE' },
];

export default function App() {
  const [view, setView] = useState<View>({ name: 'home' });
  const [timed, setTimed] = useState(true);
  const [lang, setLang] = useState<Lang>(() => loadLang());
  const [store, setStore] = useState<Store>(() => loadStore());
  const [quizKey, setQuizKey] = useState(0);
  const s = t(lang);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = s.title;
    saveLang(lang);
  }, [lang, s.title]);

  useEffect(() => {
    setAudioMuted(store.mute);
  }, [store.mute]);

  const update = useCallback((fn: (prev: Store) => Store) => {
    setStore((prev) => {
      const next = fn(prev);
      saveStore(next);
      return next;
    });
  }, []);

  const toggleMute = useCallback(() => {
    update((prev) => {
      const mute = !prev.mute;
      setAudioMuted(mute);
      return { ...prev, mute };
    });
  }, [update]);

  const onQuizComplete = useCallback(
    (mode: QuizMode) => (result: { score: number; at: number }) => {
      update((prev) => ({
        ...prev,
        ranking: addRank(prev.ranking, {
          id: String(result.at),
          score: result.score,
          mode,
          at: result.at,
        }),
        modes: {
          ...prev.modes,
          [mode]: {
            ...prev.modes[mode],
            plays: prev.modes[mode].plays + 1,
            bestScore: Math.max(prev.modes[mode].bestScore, result.score),
          },
        },
      }));
    },
    [update],
  );

  const onPairsComplete = useCallback(
    (result: { moves: number; timeMs: number; stars: number }) => {
      update((prev) => {
        const n = prev.modes.pairs;
        return {
          ...prev,
          modes: {
            ...prev.modes,
            pairs: {
              ...n,
              plays: n.plays + 1,
              stars: Math.max(n.stars, result.stars),
              bestScore: Math.max(n.bestScore, result.stars),
              bestMoves:
                n.bestMoves == null
                  ? result.moves
                  : Math.min(n.bestMoves, result.moves),
              bestTimeMs:
                n.bestTimeMs == null
                  ? result.timeMs
                  : Math.min(n.bestTimeMs, result.timeMs),
            },
          },
        };
      });
    },
    [update],
  );

  if (view.name === 'quiz') {
    return (
      <QuizView
        key={`${view.mode}-${view.timed}-${quizKey}`}
        mode={view.mode}
        timed={view.timed}
        lang={lang}
        store={store}
        onToggleMute={toggleMute}
        onBack={() => setView({ name: 'home' })}
        onComplete={
          view.timed
            ? onQuizComplete(view.mode)
            : () => {
                /* training: no ranking */
              }
        }
      />
    );
  }

  if (view.name === 'pairs') {
    return (
      <PairsView
        lang={lang}
        store={store}
        onToggleMute={toggleMute}
        onBack={() => setView({ name: 'home' })}
        onComplete={onPairsComplete}
      />
    );
  }

  if (view.name === 'cheat') {
    return (
      <CheatView
        lang={lang}
        store={store}
        onToggleMute={toggleMute}
        onBack={() => setView({ name: 'home' })}
      />
    );
  }

  if (view.name === 'rank') {
    return (
      <Shell>
        <Header
          title={s.results}
          muted={store.mute}
          onToggleMute={toggleMute}
          strings={s}
          onBack={() => setView({ name: 'home' })}
        />
        <p className="pb-3 text-sm font-bold text-parchment/70">{s.resultsBlurb}</p>
        <div className="rounded-3xl bg-parchment px-4 py-4">
          <RankList
            entries={store.ranking}
            modeLabels={s.modeShort}
            empty={s.emptySlot}
          />
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header
        title={s.title}
        muted={store.mute}
        onToggleMute={toggleMute}
        strings={s}
        lang={lang}
        onLang={setLang}
      />
      <p className="pb-3 text-sm leading-snug font-bold text-parchment/75">
        {s.subtitle}
      </p>
      <div className="mb-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setTimed(false)}
          className={`min-h-11 rounded-2xl text-sm font-extrabold ${
            !timed ? 'bg-parchment text-ink' : 'bg-parchment/10 text-parchment'
          }`}
        >
          {s.training}
        </button>
        <button
          type="button"
          onClick={() => setTimed(true)}
          className={`flex min-h-11 items-center justify-center gap-1 rounded-2xl text-sm font-extrabold ${
            timed ? 'bg-brass text-ink' : 'bg-parchment/10 text-parchment'
          }`}
        >
          <Timer className="size-4" aria-hidden />
          {s.timed}
        </button>
      </div>
      <div className="grid gap-2">
        {MODE_CARDS.map((card) => {
          const best = bestForMode(store, card.id);
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => {
                setQuizKey((k) => k + 1);
                setView({ name: 'quiz', mode: card.id, timed });
              }}
              className="flex min-h-18 items-center gap-3 rounded-2xl bg-parchment px-3 py-3 text-left text-ink active:opacity-90"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink font-display text-sm font-bold text-brass">
                {card.mark === 'icon' ? (
                  <Compass className="size-6" aria-hidden />
                ) : (
                  card.mark
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-lg leading-tight font-bold">
                  {s.modeTitles[card.id]}
                </span>
                <span className="mt-0.5 block text-sm leading-snug font-bold text-ink/65">
                  {s.modeBlurbs[card.id]}
                </span>
              </span>
              <span className="text-xs font-bold text-ink/35">
                {best == null ? s.emptySlot : best}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setView({ name: 'pairs' })}
          className="flex min-h-18 items-center gap-3 rounded-2xl bg-parchment px-3 py-3 text-left text-ink active:opacity-90"
        >
          <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-ink text-brass">
            <LayoutGrid className="size-6" aria-hidden />
          </span>
          <span className="min-w-0 flex-1">
            <span className="font-display block text-lg leading-tight font-bold">
              {s.modeTitles.pairs}
            </span>
            <span className="mt-0.5 block text-sm leading-snug font-bold text-ink/65">
              {s.pairsBlurb}
            </span>
          </span>
          <Stars
            value={store.modes.pairs.stars}
            label={s.starsOf3(store.modes.pairs.stars)}
          />
        </button>
      </div>
      <button
        type="button"
        onClick={() => setView({ name: 'rank' })}
        className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-parchment/10 font-extrabold text-parchment"
      >
        <Trophy className="size-5" aria-hidden />
        {s.resultsTop5}
      </button>
      <button
        type="button"
        onClick={() => setView({ name: 'cheat' })}
        className="mt-2 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-brass font-extrabold text-ink"
      >
        <BookOpen className="size-5" aria-hidden />
        {s.cheatFull}
      </button>
    </Shell>
  );
}
