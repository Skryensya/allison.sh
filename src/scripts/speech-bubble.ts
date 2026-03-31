/**
 * Speech Bubble — letter-by-letter typewriter with pretext layout + avatar mouth sync.
 *
 * Uses @chenglou/pretext for accurate multiline text measurement & layout
 * so the bubble has a stable size from the start (no reflow as letters appear).
 * Each grapheme fades in individually, synced with mouth animation.
 */

import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

export interface SpeechBubbleOptions {
  /** ms per character reveal */
  charSpeed?: number;
  /** ms to hold the complete message before hiding */
  displayDuration?: number;
  /** Array of phrases the bubble cycles through */
  phrases?: string[];
  /** CSS font shorthand for pretext measurement (must match rendered font) */
  font?: string;
  /** Max text width in px (excluding padding) */
  maxTextWidth?: number;
  /** Line height in px */
  lineHeight?: number;
}

const DEFAULT_OPTIONS: Required<SpeechBubbleOptions> = {
  charSpeed: 35,
  displayDuration: 3200,
  phrases: [],
  font: '14px Satoshi, system-ui, sans-serif',
  maxTextWidth: 220,
  lineHeight: 21,
};

/* ── Mouth phoneme helpers ──────────────────────────── */

function mouthForChar(ch: string): string {
  const c = ch.toLowerCase();
  if ('aá'.includes(c)) return 'a';
  if ('eé'.includes(c)) return 'e';
  if ('ií'.includes(c)) return 'i';
  if ('oó'.includes(c)) return 'o';
  if ('uúü'.includes(c)) return 'u';
  if ('mbpfv'.includes(c)) return 'closed';
  if ('szctdnlr'.includes(c)) return 'i';
  return 'neutral';
}

const VOWEL_RE = /[aeiouáéíóúü]/i;
const LABIAL_RE = /[mbpfv]/i;

function shapesForWord(word: string): string[] {
  const out: string[] = [];
  if (LABIAL_RE.test(word[0])) out.push('closed');
  let firstVowel: string | null = null;
  let lastVowel: string | null = null;
  for (const ch of word) {
    if (VOWEL_RE.test(ch)) {
      const shape = mouthForChar(ch);
      if (!firstVowel) firstVowel = shape;
      lastVowel = shape;
    }
  }
  if (firstVowel) {
    out.push(firstVowel);
    if (lastVowel && lastVowel !== firstVowel) out.push(lastVowel);
  } else {
    out.push('i');
  }
  return out;
}

function buildMouthTimeline(phrase: string, totalDuration: number): { shape: string; ms: number }[] {
  const words = phrase.split(/\s+/).filter(Boolean);
  const shapes: string[] = [];

  for (let w = 0; w < words.length; w++) {
    shapes.push(...shapesForWord(words[w]));
    if (w < words.length - 1) shapes.push('neutral');
  }

  if (shapes.length === 0) return [];

  // Dedupe consecutive identical shapes
  const deduped = [shapes[0]];
  for (let i = 1; i < shapes.length; i++) {
    if (shapes[i] !== deduped[deduped.length - 1]) deduped.push(shapes[i]);
  }

  // Slow mouth changes slightly: enforce a minimum interval.
  // If there are too many shapes to fit, sample them down.
  const minIntervalMs = 110;
  const maxShapes = Math.max(1, Math.floor(totalDuration / minIntervalMs));

  let final = deduped;
  if (deduped.length > maxShapes) {
    const sampled: string[] = [];
    for (let i = 0; i < maxShapes; i++) {
      const idx = Math.round((i / (maxShapes - 1)) * (deduped.length - 1));
      const shape = deduped[idx];
      if (sampled.length === 0 || sampled[sampled.length - 1] !== shape) {
        sampled.push(shape);
      }
    }
    final = sampled;
  }

  const interval = totalDuration / final.length;
  return final.map((shape, i) => ({
    shape,
    ms: Math.round(i * interval),
  }));
}

/* ── Bubble ──────────────────────────────────────────── */

type BubbleState = 'hidden' | 'typing' | 'visible' | 'hiding';

export class SpeechBubble {
  private container: HTMLDivElement;
  private inner: HTMLDivElement;
  private tail: HTMLDivElement;
  private options: Required<SpeechBubbleOptions>;
  private state: BubbleState = 'hidden';
  private phraseIndex = 0;
  private charTimers: number[] = [];
  private mouthTimers: number[] = [];
  private autoHideTimer: number | null = null;
  private hideTransitionTimer: number | null = null;
  private avatarRoot: HTMLElement | null = null;
  private prefersReducedMotion: boolean;

  constructor(options: SpeechBubbleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.container = document.createElement('div');
    this.container.className = 'avatar-speech-bubble';
    this.container.setAttribute('role', 'status');
    this.container.setAttribute('aria-live', 'polite');

    this.inner = document.createElement('div');
    this.inner.className = 'avatar-speech-bubble__inner';

    this.tail = document.createElement('div');
    this.tail.className = 'avatar-speech-bubble__tail';

    this.container.appendChild(this.inner);
    this.container.appendChild(this.tail);

    if (!document.getElementById('avatar-speech-bubble-styles')) {
      const style = document.createElement('style');
      style.id = 'avatar-speech-bubble-styles';
      style.textContent = SpeechBubble.CSS;
      document.head.appendChild(style);
    }
  }

  /* ── Public API ────────────────────────────────────── */

  show(anchorEl: HTMLElement, avatarRoot?: HTMLElement): void {
    if (this.options.phrases.length === 0) return;

    this.avatarRoot = avatarRoot ?? null;
    this.cancelTimers();

    const phrase = this.options.phrases[this.phraseIndex % this.options.phrases.length];
    this.phraseIndex++;

    if (!this.container.parentElement) {
      document.body.appendChild(this.container);
    }

    this.positionBeside(anchorEl);

    // ── Use pretext to measure & lay out lines ──
    const { font, maxTextWidth, lineHeight } = this.options;
    const prepared = prepareWithSegments(phrase, font);
    const { lines, height } = layoutWithLines(prepared, maxTextWidth, lineHeight);

    // Set bubble to exact measured size so it doesn't reflow
    const maxLineWidth = Math.max(...lines.map((l) => l.width));
    const paddingX = 16;
    const paddingY = 10;
    const innerWidth = Math.ceil(maxLineWidth) + paddingX * 2;
    const innerHeight = Math.ceil(height) + paddingY * 2;
    this.inner.style.width = `${innerWidth}px`;
    this.inner.style.height = `${innerHeight}px`;

    // Re-position now that we know the final width (flip to left if needed)
    this.positionBeside(anchorEl, innerWidth);

    // ── Build character spans per line ──
    this.inner.innerHTML = '';
    const allCharSpans: HTMLSpanElement[] = [];
    // Flat string of only the visible characters (for mouth sync)
    let visibleChars = '';

    lines.forEach((line, lineIdx) => {
      const lineEl = document.createElement('div');
      lineEl.className = 'avatar-speech-bubble__line';
      lineEl.style.height = `${lineHeight}px`;

      // Walk each grapheme in the line text
      const graphemes = [...line.text];
      graphemes.forEach((grapheme) => {
        const span = document.createElement('span');
        span.className = 'avatar-speech-bubble__char';
        span.textContent = grapheme;
        lineEl.appendChild(span);
        allCharSpans.push(span);
        visibleChars += grapheme;
      });

      this.inner.appendChild(lineEl);
    });

    // ── Show bubble ──
    this.state = 'typing';
    this.container.style.display = 'block';
    void this.container.offsetHeight;
    this.container.classList.add('visible');

    if (this.prefersReducedMotion) {
      allCharSpans.forEach((s) => s.classList.add('revealed'));
      this.state = 'visible';
      this.scheduleAutoHide();
      return;
    }

    // ── Letter-by-letter reveal ──
    const cs = this.options.charSpeed;
    const totalTypingTime = allCharSpans.length * cs;

    allCharSpans.forEach((span, i) => {
      const t = window.setTimeout(() => {
        span.classList.add('revealed');
      }, i * cs);
      this.charTimers.push(t);
    });

    // ── Mouth timeline ──
    if (this.avatarRoot) {
      const timeline = buildMouthTimeline(phrase, totalTypingTime);
      for (const kf of timeline) {
        const t = window.setTimeout(() => {
          this.dispatchMouth(kf.shape);
        }, kf.ms);
        this.mouthTimers.push(t);
      }
    }

    // ── Done ──
    const doneTimer = window.setTimeout(() => {
      this.state = 'visible';
      this.dispatchMouth('default');
      this.scheduleAutoHide();
    }, totalTypingTime + 80);
    this.charTimers.push(doneTimer);
  }

  next(anchorEl: HTMLElement, avatarRoot?: HTMLElement): void {
    // Allow advancing only once the current message finished typing.
    // - typing: ignore
    // - visible: advance to next message immediately
    // - hidden: show
    // - hiding: ignore
    if (this.state === 'typing' || this.state === 'hiding') return;

    if (this.state === 'visible') {
      this.hideInstant();
    }

    this.show(anchorEl, avatarRoot);
  }

  hide(): void {
    if (this.state === 'hidden' || this.state === 'hiding') return;
    this.cancelTimers();
    this.state = 'hiding';
    this.dispatchMouth('default');

    this.container.classList.remove('visible');
    this.container.classList.add('hiding');

    this.hideTransitionTimer = window.setTimeout(() => {
      this.container.classList.remove('hiding');
      this.container.style.display = 'none';
      this.state = 'hidden';
    }, 200);
  }

  destroy(): void {
    this.cancelTimers();
    this.dispatchMouth('default');
    this.container.remove();
  }

  /* ── Private ───────────────────────────────────────── */

  private positionBeside(anchor: HTMLElement, bubbleWidth?: number): 'left' | 'right' {
    const rect = anchor.getBoundingClientRect();
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    const margin = 12;
    const gutter = 8;
    const viewportLeft = scrollX + gutter;
    const viewportRight = scrollX + window.innerWidth - gutter;

    const top = rect.top + rect.height / 2 + scrollY;

    // Default: to the right
    let side: 'right' | 'left' = 'right';
    let left = rect.right + margin + scrollX;

    if (bubbleWidth) {
      const wouldOverflowRight = left + bubbleWidth > viewportRight;
      if (wouldOverflowRight) {
        side = 'left';
        left = rect.left - margin - bubbleWidth + scrollX;
      }

      // Clamp
      left = Math.max(viewportLeft, Math.min(left, viewportRight - bubbleWidth));
    }

    this.container.dataset.side = side;
    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;

    return side;
  }

  private hideInstant(): void {
    this.cancelTimers();
    this.dispatchMouth('default');
    this.container.classList.remove('visible', 'hiding');
    this.container.style.display = 'none';
    this.state = 'hidden';
  }

  private scheduleAutoHide(): void {
    this.autoHideTimer = window.setTimeout(() => this.hide(), this.options.displayDuration);
  }

  private cancelTimers(): void {
    this.charTimers.forEach((t) => clearTimeout(t));
    this.charTimers = [];
    this.mouthTimers.forEach((t) => clearTimeout(t));
    this.mouthTimers = [];
    if (this.autoHideTimer) { clearTimeout(this.autoHideTimer); this.autoHideTimer = null; }
    if (this.hideTransitionTimer) { clearTimeout(this.hideTransitionTimer); this.hideTransitionTimer = null; }
  }

  private dispatchMouth(state: string): void {
    if (!this.avatarRoot) return;
    this.avatarRoot.dispatchEvent(
      new CustomEvent('avatar:set-mouth', { detail: { state }, bubbles: true }),
    );
  }


  /* ── Styles ────────────────────────────────────────── */

  private static CSS = `
    .avatar-speech-bubble {
      position: absolute;
      /* Keep the bubble under the fixed top/bottom fades so it gets “masked” with the content */
      z-index: 25;
      pointer-events: none;
      display: none;

      /* Share colors between inner + tail */
      --bubble-bg: var(--color-text, #1F1C18);
      --bubble-fg: var(--color-bg, #F4F1EB);

      /* Shape tokens (match navbar hover pill) */
      --bubble-radius: 999px;
      --bubble-skew: -12deg;
      --bubble-inset-y: -2px;
      --bubble-inset-x: -6px;

      /* Entrance: scale from the tail side */
      transform-origin: left center;
      transform: translateY(-50%) scale(0.85) translateX(-8px);
      opacity: 0;
      will-change: transform, opacity;
    }

    .avatar-speech-bubble[data-side="left"] {
      transform-origin: right center;
      transform: translateY(-50%) scale(0.85) translateX(8px);
    }

    .avatar-speech-bubble.visible {
      opacity: 1;
      transform: translateY(-50%) scale(1) translateX(0);
      transition:
        opacity 200ms cubic-bezier(0.23, 1, 0.32, 1),
        transform 280ms cubic-bezier(0.23, 1, 0.32, 1);
    }

    .avatar-speech-bubble[data-side="left"].visible {
      transform: translateY(-50%) scale(1) translateX(0);
    }

    .avatar-speech-bubble.hiding {
      opacity: 0;
      transform: translateY(-50%) scale(0.95) translateX(-4px);
      transition:
        opacity 150ms ease,
        transform 150ms ease;
    }

    .avatar-speech-bubble__inner {
      position: relative;
      background: transparent;
      color: var(--bubble-fg);
      border-radius: var(--bubble-radius);
      padding: 10px 16px;
      font-family: var(--font-sans, system-ui, sans-serif);
      font-size: 0.875rem;
      line-height: 1.5;
      letter-spacing: -0.01em;
      white-space: pre;
      text-align: left;
      isolation: isolate;
      z-index: 0;
    }

    /* Replicate the navbar hover shape without skewing the text */
    .avatar-speech-bubble__inner::before {
      content: '';
      position: absolute;
      inset: var(--bubble-inset-y) var(--bubble-inset-x);
      border-radius: var(--bubble-radius);
      background: var(--bubble-bg);
      transform: skewX(var(--bubble-skew));
      z-index: -1;
    }

    .avatar-speech-bubble__line {
      display: flex;
      align-items: center;
    }

    /* Tail (rounded) — keeps the "arrow" but matches the pill corner language */
    .avatar-speech-bubble__tail {
      position: absolute;
      top: 50%;
      left: var(--bubble-inset-x);
      width: 14px;
      height: 14px;
      background: var(--bubble-bg);
      border-radius: 4px;

      /* Más pegado a la burbuja: menos translateX que -50% */
      transform: translate(-20%, -50%) rotate(45deg) skewX(var(--bubble-skew));

      /* Justo debajo del shape principal */
      z-index: -1;
    }

    /* Flip tail when bubble is on the left of the avatar */
    .avatar-speech-bubble[data-side="left"] .avatar-speech-bubble__tail {
      left: auto;
      right: var(--bubble-inset-x);
      transform: translate(20%, -50%) rotate(45deg) skewX(var(--bubble-skew));
    }

    /* Character animation */
    .avatar-speech-bubble__char {
      opacity: 0;
      transition: opacity 80ms ease-out;
      white-space: pre;
    }

    .avatar-speech-bubble__char.revealed {
      opacity: 1;
    }

    /* Dark mode (set explicit fallbacks) */
    html.dark .avatar-speech-bubble {
      --bubble-bg: var(--color-text, #E8E4DD);
      --bubble-fg: var(--color-bg, #0F0F0E);
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .avatar-speech-bubble,
      .avatar-speech-bubble.visible,
      .avatar-speech-bubble.hiding {
        transition: none !important;
      }

      .avatar-speech-bubble__char {
        transition: none !important;
      }

      .avatar-speech-bubble.visible {
        opacity: 1;
        transform: translateY(-50%);
      }

      .avatar-speech-bubble__char.revealed {
        opacity: 1;
      }
    }
  `;
}
