import { DIRECTIONS, abbr, name, type Direction, type Lang } from '../directions';

const CX = 120;
const CY = 120;
const INNER = 40;
const OUTER = 90;

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(rad), y: CY - r * Math.cos(rad) };
}

function wedgePath(deg: number): string {
  const gap = 2.6;
  const a0 = deg - 22.5 + gap / 2;
  const a1 = deg + 22.5 - gap / 2;
  const o0 = polar(OUTER, a0);
  const o1 = polar(OUTER, a1);
  const i1 = polar(INNER, a1);
  const i0 = polar(INNER, a0);
  return [
    `M ${o0.x.toFixed(2)} ${o0.y.toFixed(2)}`,
    `A ${OUTER} ${OUTER} 0 0 1 ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${INNER} ${INNER} 0 0 0 ${i0.x.toFixed(2)} ${i0.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

function fillFor(
  dir: Direction,
  correctId: string | null,
  wrongId: string | null,
): string {
  if (wrongId === dir.id) return 'var(--color-brick)';
  if (correctId === dir.id) return 'var(--color-moss)';
  if (dir.main) return 'var(--color-ink)';
  return 'color-mix(in srgb, var(--color-brass) 62%, var(--color-ink))';
}

type Props = {
  legend?: boolean;
  /** UI language for legend labels (cheat sheet). */
  lang?: Lang;
  correctId?: string | null;
  wrongId?: string | null;
  /** During feedback, briefly show abbr on the picked/correct wedge. */
  labelLang?: Lang | 'none';
  disabled?: boolean;
  onPick?: (id: string) => void;
  ariaLabel?: string;
};

export function CompassRose({
  legend = false,
  lang = 'pl',
  correctId = null,
  wrongId = null,
  labelLang = 'none',
  disabled = false,
  onPick,
  ariaLabel,
}: Props) {
  const ticks = Array.from({ length: 72 }, (_, i) => i * 5);

  return (
    <svg
      viewBox="0 0 240 240"
      className="h-auto w-full"
      role={legend ? 'img' : 'group'}
      aria-label={legend ? ariaLabel : undefined}
    >
      <circle cx={CX} cy={CY} r={108} fill="var(--color-parchment)" />
      <circle
        cx={CX}
        cy={CY}
        r={104}
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth={1.5}
      />
      {ticks.map((deg) => {
        const major = deg % 45 === 0;
        const a = polar(major ? 104 : 101, deg);
        const b = polar(major ? 96 : 99, deg);
        return (
          <line
            key={deg}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke="color-mix(in srgb, var(--color-ink) 55%, var(--color-brass))"
            strokeWidth={major ? 1.6 : 0.7}
          />
        );
      })}
      {DIRECTIONS.map((dir) => {
        const showLabel =
          legend ||
          (labelLang !== 'none' && (dir.id === correctId || dir.id === wrongId));
        const label = legend
          ? abbr(dir, lang)
          : labelLang === 'none'
            ? ''
            : abbr(dir, labelLang);
        const pos = polar(65, dir.deg);
        const interactive = !legend && !disabled;
        return (
          <g key={dir.id}>
            <path
              d={wedgePath(dir.deg)}
              fill={fillFor(
                dir,
                legend ? null : correctId,
                legend ? null : wrongId,
              )}
              className={interactive ? 'wedge' : 'pointer-events-none'}
              role={interactive ? 'button' : undefined}
              tabIndex={interactive ? 0 : undefined}
              aria-label={interactive ? name(dir, lang) : undefined}
              onClick={
                interactive
                  ? () => {
                      onPick?.(dir.id);
                    }
                  : undefined
              }
              onKeyDown={
                interactive
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onPick?.(dir.id);
                      }
                    }
                  : undefined
              }
            />
            {showLabel ? (
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="var(--color-parchment)"
                fontFamily="Nunito, sans-serif"
                fontWeight={800}
                fontSize={label.length > 2 ? 8 : 15}
                className="pointer-events-none"
              >
                {label}
              </text>
            ) : null}
          </g>
        );
      })}
      <circle cx={CX} cy={CY} r={34} fill="var(--color-parchment)" />
      <circle
        cx={CX}
        cy={CY}
        r={34}
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth={1.5}
      />
      <polygon
        points="120,86 126,120 120,116 114,120"
        fill="var(--color-brick)"
      />
      <polygon
        points="120,154 126,120 120,124 114,120"
        fill="color-mix(in srgb, var(--color-ink) 35%, var(--color-parchment))"
      />
      <circle cx={CX} cy={CY} r={5} fill="var(--color-brass)" />
      <circle cx={CX} cy={CY} r={2} fill="var(--color-ink)" />
    </svg>
  );
}

export function MiniNeedle({ deg }: { deg: number }) {
  return (
    <svg viewBox="0 0 36 36" className="size-8 shrink-0" aria-hidden>
      <circle
        cx="18"
        cy="18"
        r="15"
        fill="none"
        stroke="var(--color-brass)"
        strokeWidth="1.2"
      />
      <g transform={`rotate(${deg} 18 18)`}>
        <polygon points="18,6 20.2,18 18,16.2 15.8,18" fill="var(--color-brick)" />
        <polygon
          points="18,30 20.2,18 18,19.8 15.8,18"
          fill="color-mix(in srgb, var(--color-ink) 35%, var(--color-parchment))"
        />
        <circle cx="18" cy="18" r="2.2" fill="var(--color-brass)" />
      </g>
    </svg>
  );
}
