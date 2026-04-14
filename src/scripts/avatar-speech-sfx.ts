/**
 * Short Web-Audio blips when there is no voice MP3 (otherwise we only play one layer: the clip).
 * Monophonic: starting a new blip stops the previous so two synths never stack.
 * Respects prefers-reduced-motion; call resumeAvatarSfxContext from a user gesture before first play.
 */

let ctx: AudioContext | null = null;
let activeOscillators: OscillatorNode[] = [];

function stopSynthesizedSfx(): void {
  if (!ctx) {
    activeOscillators = [];
    return;
  }
  const t = ctx.currentTime;
  for (const o of activeOscillators) {
    try {
      o.stop(t);
    } catch {
      /* already stopped */
    }
  }
  activeOscillators = [];
}

function prefersReducedSound(): boolean {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function ensureCtx(): AudioContext | null {
  if (prefersReducedSound()) return null;
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    ctx = new Ctx();
  }
  return ctx;
}

export function resumeAvatarSfxContext(): void {
  const c = ensureCtx();
  if (c?.state === 'suspended') void c.resume();
}

/** Soft “bubble open” chirp — only used when there is no voice MP3. */
export function playSpeechPresenceBlip(): void {
  const c = ensureCtx();
  if (!c) return;
  stopSynthesizedSfx();
  const now = c.currentTime;
  const osc = c.createOscillator();
  const g = c.createGain();
  const filter = c.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(2800, now);
  filter.Q.setValueAtTime(0.7, now);

  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(780, now + 0.045);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.028, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0008, now + 0.072);

  osc.connect(filter);
  filter.connect(g);
  g.connect(c.destination);

  activeOscillators.push(osc);
  osc.start(now);
  osc.stop(now + 0.08);
}

const MOUTH_FREQ_HZ: Record<string, number> = {
  closed: 240,
  neutral: 360,
  a: 620,
  e: 740,
  i: 900,
  o: 400,
  u: 480,
};

/** Tiny phoneme tick — only when there is no voice MP3; monophonic (cuts prior blip). */
export function playMouthSfx(shape: string): void {
  if (shape === 'default' || shape === 'smile') return;

  const c = ensureCtx();
  if (!c) return;

  stopSynthesizedSfx();

  const freq = MOUTH_FREQ_HZ[shape] ?? MOUTH_FREQ_HZ.neutral;
  const now = c.currentTime;

  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(freq * (0.97 + Math.random() * 0.06), now);

  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.042, now + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0008, now + 0.026);

  osc.connect(g);
  g.connect(c.destination);

  activeOscillators.push(osc);
  osc.start(now);
  osc.stop(now + 0.032);
}
