import type { ReactNode } from 'react';
import { ArrowLeft, Volume2, VolumeX } from 'lucide-react';
import type { Lang } from '../directions';
import type { Strings } from '../i18n';

export function Shell({
  children,
  fit = false,
}: {
  children: ReactNode;
  fit?: boolean;
}) {
  return (
    <div className="relative min-h-dvh bg-ink text-parchment">
      <div className="map-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 hidden size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/25 md:block" />
      <div
        className={`relative mx-auto flex w-full max-w-md flex-col px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] ${
          fit ? 'min-h-dvh' : 'min-h-dvh'
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function LogoMark() {
  return (
    <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brass text-ink">
      <svg viewBox="0 0 32 32" className="size-6" aria-hidden>
        <circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" strokeWidth="1.6" />
        <polygon points="16,6 18.2,16 16,14.6 13.8,16" fill="currentColor" />
        <polygon
          points="16,26 18.2,16 16,17.4 13.8,16"
          fill="currentColor"
          opacity="0.45"
        />
      </svg>
    </span>
  );
}

type HeaderProps = {
  title: string;
  muted: boolean;
  onToggleMute: () => void;
  strings: Strings;
  onBack?: () => void;
  aside?: ReactNode;
  lang?: Lang;
  onLang?: (lang: Lang) => void;
};

export function Header({
  title,
  muted,
  onToggleMute,
  strings,
  onBack,
  aside,
  lang,
  onLang,
}: HeaderProps) {
  return (
    <header className="flex items-center gap-2 pb-3">
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          aria-label={strings.back}
          className="grid size-11 shrink-0 place-items-center rounded-full bg-parchment/10 text-parchment"
        >
          <ArrowLeft className="size-5" aria-hidden />
        </button>
      ) : (
        <LogoMark />
      )}
      <div className="min-w-0 flex-1">
        <p className="font-display text-xl leading-none font-bold tracking-tight">
          {title}
        </p>
      </div>
      {aside}
      {lang && onLang ? (
        <div className="flex shrink-0 overflow-hidden rounded-full bg-parchment/10 text-xs font-extrabold">
          <button
            type="button"
            onClick={() => onLang('pl')}
            className={`px-2.5 py-2 ${
              lang === 'pl' ? 'bg-brass text-ink' : 'text-parchment'
            }`}
            aria-pressed={lang === 'pl'}
          >
            PL
          </button>
          <button
            type="button"
            onClick={() => onLang('en')}
            className={`px-2.5 py-2 ${
              lang === 'en' ? 'bg-brass text-ink' : 'text-parchment'
            }`}
            aria-pressed={lang === 'en'}
          >
            EN
          </button>
        </div>
      ) : null}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? strings.unmute : strings.mute}
        className="grid size-11 shrink-0 place-items-center rounded-full bg-parchment/10 text-parchment"
      >
        {muted ? (
          <VolumeX className="size-5" aria-hidden />
        ) : (
          <Volume2 className="size-5" aria-hidden />
        )}
      </button>
    </header>
  );
}
