type Tone = {
  freq: number;
  at: number;
  dur: number;
  type?: OscillatorType;
  gain?: number;
};

let ctx: AudioContext | null = null;
let muted = false;

export function setMuted(m: boolean): void {
  muted = m;
}

function ensureCtx(): void {
  const AC =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return;
  if (!ctx) ctx = new AC();
  if (ctx.state === 'suspended') void ctx.resume();
}

function play(tones: Tone[]): void {
  if (muted || !ctx) return;
  const t0 = ctx.currentTime;
  for (const n of tones) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = n.type ?? 'triangle';
    osc.frequency.setValueAtTime(n.freq, t0 + n.at);
    gain.gain.setValueAtTime(1e-4, t0 + n.at);
    gain.gain.exponentialRampToValueAtTime(n.gain ?? 0.06, t0 + n.at + 0.02);
    gain.gain.exponentialRampToValueAtTime(1e-4, t0 + n.at + n.dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t0 + n.at);
    osc.stop(t0 + n.at + n.dur + 0.02);
  }
}

export function beep(kind: 'ok' | 'no' | 'flip' | 'win'): void {
  ensureCtx();
  if (kind === 'ok') {
    play([
      { freq: 523.25, at: 0, dur: 0.12 },
      { freq: 659.25, at: 0.08, dur: 0.16 },
    ]);
  } else if (kind === 'no') {
    play([{ freq: 196, at: 0, dur: 0.18, type: 'sawtooth', gain: 0.035 }]);
  } else if (kind === 'flip') {
    play([{ freq: 392, at: 0, dur: 0.07, type: 'sine', gain: 0.04 }]);
  } else {
    play([
      { freq: 523.25, at: 0, dur: 0.14 },
      { freq: 659.25, at: 0.12, dur: 0.14 },
      { freq: 783.99, at: 0.24, dur: 0.22 },
    ]);
  }
}
