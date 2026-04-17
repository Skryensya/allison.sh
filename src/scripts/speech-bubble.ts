import {
  layoutWithLines,
  measureLineStats,
  measureNaturalWidth,
  prepareWithSegments,
  type PreparedTextWithSegments,
} from '@chenglou/pretext';

/**
 * Narrowest max line width that keeps the same line count as laying out at `contentBudget`.
 * Same idea as `findTightWrapMetrics` in Pretext's bubbles demo (binary search on width).
 */
function findTightContentWidthForBudget(
  prepared: PreparedTextWithSegments,
  contentBudget: number,
): number {
  const initialLineCount = measureLineStats(prepared, contentBudget).lineCount;
  if (initialLineCount <= 1) {
    return Math.min(contentBudget, measureNaturalWidth(prepared));
  }

  let lo = 1;
  let hi = Math.max(1, Math.ceil(contentBudget));
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (measureLineStats(prepared, mid).lineCount <= initialLineCount) {
      hi = mid;
    } else {
      lo = mid + 1;
    }
  }
  return lo;
}

/**
 * Speech Bubble — simplified letter-by-letter bubble with avatar mouth sync.
 */

type MediaQueryListLegacy = MediaQueryList & {
  addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) => void;
  removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) => void;
};

export interface SpeechBubbleOptions {
  charSpeed?: number;
  displayDuration?: number;
  phrases?: string[];
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
  /** Fired for every mouth keyframe (including `default` when speech ends). */
  onMouthShape?: (shape: string) => void;
  /** After the bubble is fully dismissed: normal hide (post-`displayDuration` + CSS) or `skipReadingPause()` (instant). Not called if `destroy()` runs first. */
  onAfterHide?: () => void;
}

const DEFAULT_OPTIONS = {
  charSpeed: 35,
  displayDuration: 3200,
  phrases: [] as string[],
};

const preparedTextCache = new Map<string, PreparedTextWithSegments>();

const SPEECH_BUBBLE_LAYER_ID = 'avatar-speech-bubble-layer';

/**
 * Capa bajo `#main-content` (o `body`): bubble `absolute` respecto al main con `position: relative`.
 * Las coords se calculan como (anchorRect − mainRect) en espacio viewport; al hacer scroll de página
 * ambos se mueven igual y el bubble queda pegado al avatar sin listeners de scroll.
 */
function getSpeechBubbleLayer(host: HTMLElement): HTMLElement {
  let el = document.getElementById(SPEECH_BUBBLE_LAYER_ID);
  if (!el) {
    el = document.createElement('div');
    el.id = SPEECH_BUBBLE_LAYER_ID;
    el.setAttribute('aria-hidden', 'true');
    /* Keep below `#viewport-gradient` (z-40 in Base.astro) and above main sections (e.g. z-30). */
    el.style.cssText =
      'position:absolute;left:0;top:0;width:0;height:0;margin:0;padding:0;border:0;overflow:visible;pointer-events:none;z-index:35';
  }
  if (el.parentElement !== host) {
    host.appendChild(el);
  }
  return el as HTMLElement;
}

function getPreparedText(text: string, font: string) {
  const cacheKey = `${font}__${text}`;
  const cached = preparedTextCache.get(cacheKey);
  if (cached) return cached;

  const prepared = prepareWithSegments(text, font);
  preparedTextCache.set(cacheKey, prepared);
  return prepared;
}

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
  private options: SpeechBubbleOptions & typeof DEFAULT_OPTIONS;
  private state: BubbleState = 'hidden';
  private phraseIndex = 0;
  private typingApply: ((count: number) => void) | null = null;
  private typingTotalChars = 0;
  private charTimers: number[] = [];
  private mouthTimers: number[] = [];
  private autoHideTimer: number | null = null;
  private hideTransitionTimer: number | null = null;
  private avatarRoot: HTMLElement | null = null;
  private prefersReducedMotion: boolean;
  private reducedMotionQuery: MediaQueryListLegacy;

  private currentAnchor: HTMLElement | null = null;
  private viewportListenersAttached = false;
  private viewportRaf = 0;

  private onViewportChange = (): void => {
    if (this.state === 'hidden' || !this.currentAnchor) return;
    if (this.viewportRaf) return;
    this.viewportRaf = requestAnimationFrame(() => {
      this.viewportRaf = 0;
      const size = this.getBubbleSize();
      this.positionSmart(this.currentAnchor!, size ?? undefined);
    });
  };

  private onReducedMotionChange = (event: MediaQueryListEvent): void => {
    this.prefersReducedMotion = event.matches;

    if (!event.matches) return;

    if (this.state === 'typing') {
      this.revealInstantly();
      return;
    }

    if (this.state === 'visible') {
      this.cancelTimers();
      this.dispatchMouth('default');
      this.scheduleAutoHide();
      return;
    }

    if (this.state === 'hiding') {
      this.hideInstant();
    }
  };

  constructor(options: SpeechBubbleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options } as SpeechBubbleOptions & typeof DEFAULT_OPTIONS;
    this.reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)') as MediaQueryListLegacy;
    this.prefersReducedMotion = this.reducedMotionQuery.matches;

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

    if (this.reducedMotionQuery.addEventListener) {
      this.reducedMotionQuery.addEventListener('change', this.onReducedMotionChange);
    } else {
      const legacyQuery = this.reducedMotionQuery as {
        addListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) => void;
      };
      legacyQuery.addListener?.(this.onReducedMotionChange);
    }
  }

  /* ── Public API ────────────────────────────────────── */

  show(anchorEl: HTMLElement, avatarRoot?: HTMLElement): void {
    if (this.options.phrases.length === 0) return;

    this.avatarRoot = avatarRoot ?? null;
    this.cancelTimers();

    const phrase = this.options.phrases[this.phraseIndex % this.options.phrases.length];
    this.phraseIndex++;

    const main = anchorEl.closest('#main-content') as HTMLElement | null;
    const host = main ?? document.body;
    const layer = getSpeechBubbleLayer(host);
    if (this.container.parentElement !== layer) {
      layer.appendChild(this.container);
    }

    this.currentAnchor = anchorEl;
    this.addViewportListeners();

    // Must be visible before measuring.
    this.container.style.display = 'block';

    const { width, height, totalChars, applyVisibleCharacters } = this.renderPhraseLayout(phrase);

    this.typingApply = applyVisibleCharacters;
    this.typingTotalChars = totalChars;

    this.state = 'typing';

    requestAnimationFrame(() => {
      if (!this.currentAnchor) return;
      this.positionSmart(this.currentAnchor, { width, height });
      this.container.classList.add('visible');
    });

    const cs = this.options.charSpeed;
    const totalTypingTime = totalChars * cs;

    if (this.prefersReducedMotion) {
      applyVisibleCharacters(totalChars);
      this.state = 'visible';
      this.options.onTypingStart?.();
      window.setTimeout(() => this.options.onTypingEnd?.(), totalTypingTime + 80);
      this.scheduleAutoHide();
      return;
    }

    this.options.onTypingStart?.();

    // ── Letter-by-letter reveal ──
    for (let i = 0; i < totalChars; i++) {
      const t = window.setTimeout(() => {
        applyVisibleCharacters(i + 1);
      }, i * cs);
      this.charTimers.push(t);
    }

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
      this.options.onTypingEnd?.();
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
    this.removeViewportListeners();
    this.state = 'hiding';
    this.dispatchMouth('default');

    this.container.classList.remove('visible');
    this.container.classList.add('hiding');

    this.hideTransitionTimer = window.setTimeout(() => {
      this.container.classList.remove('hiding');
      this.container.style.display = 'none';
      this.state = 'hidden';
      this.typingApply = null;
      this.typingTotalChars = 0;
      this.options.onAfterHide?.();
    }, 200);
  }

  destroy(): void {
    this.cancelTimers();
    this.removeViewportListeners();
    this.dispatchMouth('default');
    this.state = 'hidden';

    if (this.reducedMotionQuery.removeEventListener) {
      this.reducedMotionQuery.removeEventListener('change', this.onReducedMotionChange);
    } else {
      const legacyQuery = this.reducedMotionQuery as {
        removeListener?: (listener: (this: MediaQueryList, ev: MediaQueryListEvent) => unknown) => void;
      };
      legacyQuery.removeListener?.(this.onReducedMotionChange);
    }

    this.container.remove();
  }

  /** True while typing, visible, or hiding — caller should not start another phrase yet. */
  isActive(): boolean {
    return this.state !== 'hidden';
  }

  /**
   * Typing finished and the bubble is waiting for `displayDuration` before auto-hide.
   * Closes immediately (no CSS hide). Still runs `onAfterHide` so callers match the normal hide cooldown path.
   * Returns false if still typing or hiding.
   */
  skipReadingPause(): boolean {
    if (this.state !== 'visible') return false;
    this.hideInstant();
    this.options.onAfterHide?.();
    return true;
  }

  /* ── Private ───────────────────────────────────────── */

  private addViewportListeners(): void {
    if (this.viewportListenersAttached) return;
    this.viewportListenersAttached = true;
    window.addEventListener('resize', this.onViewportChange, { passive: true });
    window.visualViewport?.addEventListener('resize', this.onViewportChange, { passive: true });
    window.visualViewport?.addEventListener('scroll', this.onViewportChange, { passive: true });
  }

  private removeViewportListeners(): void {
    if (!this.viewportListenersAttached) return;
    this.viewportListenersAttached = false;
    window.removeEventListener('resize', this.onViewportChange);
    window.visualViewport?.removeEventListener('resize', this.onViewportChange);
    window.visualViewport?.removeEventListener('scroll', this.onViewportChange);
    if (this.viewportRaf) {
      cancelAnimationFrame(this.viewportRaf);
      this.viewportRaf = 0;
    }
    this.currentAnchor = null;
  }

  private getBubbleSize(): { width: number; height: number } | null {
    const w = Number.parseFloat(this.inner.style.width || '');
    const h = Number.parseFloat(this.inner.style.height || '');
    if (Number.isFinite(w) && w > 0 && Number.isFinite(h) && h > 0) return { width: w, height: h };

    const r = this.inner.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) return { width: r.width, height: r.height };

    return null;
  }

  private getTypographyConfig() {
    const isMobile = window.matchMedia('(max-width: 40rem)').matches;

    return {
      isMobile,
      /* Must match `.avatar-speech-bubble__inner` — Pretext uses canvas measureText (README). */
      font: isMobile ? '400 14px Inter' : '400 16px Inter',
      lineHeight: isMobile ? 20.3 : 23.2,
      paddingX: isMobile ? 14 : 16,
      paddingY: isMobile ? 9 : 10,
      maxWidthCap: isMobile ? 228 : 280,
      viewportPadding: isMobile ? 24 : 28,
      preferredMaxLines: isMobile ? 3 : 2,
    };
  }

  private renderPhraseLayout(phrase: string): {
    width: number;
    height: number;
    totalChars: number;
    applyVisibleCharacters: (count: number) => void;
  } {
    const config = this.getTypographyConfig();
    const prepared = getPreparedText(phrase, config.font);

    const maxOuterWidth = Math.max(100, Math.min(config.maxWidthCap, window.innerWidth - config.viewportPadding));
    const maxContentWidth = Math.max(56, maxOuterWidth - config.paddingX * 2);
    const natural = measureNaturalWidth(prepared);
    /* Skewed ::before extends past the text box slightly; keep in sync with bubble CSS insets. */
    const outerSkewFudgePx = 8;

    this.inner.innerHTML = '';
    this.inner.style.height = '';
    this.inner.style.minHeight = '';
    this.inner.style.maxWidth = `${Math.ceil(maxOuterWidth)}px`;
    this.inner.style.width = 'max-content';

    const renderLines = (texts: string[]) => {
      this.inner.innerHTML = '';

      return texts.map((lineText) => {
        const lineEl = document.createElement('div');
        lineEl.className = 'avatar-speech-bubble__line';
        lineEl.textContent = lineText;
        this.inner.appendChild(lineEl);
        return lineEl;
      });
    };

    let wrapContentWidth: number;
    if (natural <= maxContentWidth) {
      wrapContentWidth = natural;
    } else {
      const statsAtMax = measureLineStats(prepared, maxContentWidth);
      if (statsAtMax.lineCount <= config.preferredMaxLines) {
        wrapContentWidth = findTightContentWidthForBudget(prepared, maxContentWidth);
      } else {
        wrapContentWidth = maxContentWidth;
      }
    }

    const layout = layoutWithLines(prepared, wrapContentWidth, config.lineHeight);
    const lineTexts = (layout.lines.length ? layout.lines : [{ text: '' }]).map((line) => line.text);
    const lineElements = renderLines(lineTexts);
    const isSingleLine = lineTexts.length <= 1;

    this.inner.dataset.compact = isSingleLine ? 'true' : 'false';

    const compactPaddingX = isSingleLine ? (config.isMobile ? 12 : 14) : config.paddingX;
    const compactPaddingY = isSingleLine ? (config.isMobile ? 7 : 8) : config.paddingY;

    const maxLineW = layout.lines.reduce((m, line) => Math.max(m, line.width), 0);
    const width = Math.ceil(
      Math.min(maxOuterWidth, maxLineW + compactPaddingX * 2 + outerSkewFudgePx),
    );
    this.inner.style.width = `${width}px`;

    const measuredInner = Math.ceil(this.inner.scrollHeight + 2);
    const minInnerHeight = isSingleLine
      ? Math.ceil(compactPaddingY * 2 + config.lineHeight) + 2
      : Math.ceil(config.paddingY * 2 + config.lineHeight * 2) + 2;
    const height = Math.max(measuredInner, minInnerHeight);
    this.inner.style.height = '';
    this.inner.style.minHeight = `${height}px`;

    const lineGraphemes = lineTexts.map((line) => [...line]);
    const lineLengths = lineGraphemes.map((line) => line.length);
    const totalChars = lineLengths.reduce((sum, length) => sum + length, 0);

    const applyVisibleCharacters = (count: number) => {
      let remaining = Math.max(0, count);

      lineGraphemes.forEach((graphemes, index) => {
        const lineLength = lineLengths[index];
        const visibleInLine = Math.max(0, Math.min(lineLength, remaining));
        lineElements[index].textContent = graphemes.slice(0, visibleInLine).join('');
        remaining -= lineLength;
      });
    };

    applyVisibleCharacters(0);

    return {
      width,
      height,
      totalChars,
      applyVisibleCharacters,
    };
  }

  /**
   * Siempre a la derecha del ancla. Si el ancla está en `#main-content`, coords relativas al main
   * (viewport): no hace falta actualizar en scroll de página. Si no hay main, coords de documento en `body`.
   */
  private positionSmart(
    anchor: HTMLElement,
    bubbleSize?: { width: number; height: number },
  ): 'right' {
    const size = bubbleSize ?? this.getBubbleSize() ?? { width: 260, height: 64 };

    const margin = 12;
    const gutterX = 10;
    const gutterY = 10;

    const rect = anchor.getBoundingClientRect();
    const halfH = size.height / 2;

    const clamp = (value: number, min: number, max: number) => {
      if (max < min) return min;
      return Math.max(min, Math.min(value, max));
    };

    const main = anchor.closest('#main-content');
    if (main) {
      const mainRect = main.getBoundingClientRect();
      let left = rect.right - mainRect.left + margin;
      let centerY = (rect.top + rect.bottom) / 2 - mainRect.top;
      const minL = -mainRect.left + gutterX;
      const maxL = window.innerWidth - mainRect.left - gutterX - size.width;
      const minCy = -mainRect.top + gutterY + halfH;
      const maxCy = window.innerHeight - mainRect.top - gutterY - halfH;
      left = clamp(left, minL, maxL);
      centerY = clamp(centerY, minCy, maxCy);
      this.container.dataset.side = 'right';
      this.container.style.left = `${left}px`;
      this.container.style.top = `${centerY}px`;
      return 'right';
    }

    const sx = window.scrollX;
    const sy = window.scrollY;
    const docRight = rect.right + sx;
    const docCenterY = (rect.top + rect.bottom) / 2 + sy;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const viewLeft = sx;
    const viewRight = sx + vw;
    const viewTop = sy;
    const viewBottom = sy + vh;
    let left = docRight + margin;
    let centerY = docCenterY;
    left = clamp(left, viewLeft + gutterX, viewRight - gutterX - size.width);
    centerY = clamp(centerY, viewTop + gutterY + halfH, viewBottom - gutterY - halfH);
    this.container.dataset.side = 'right';
    this.container.style.left = `${left}px`;
    this.container.style.top = `${centerY}px`;
    return 'right';
  }

  private revealInstantly(): void {
    this.cancelTimers();
    this.typingApply?.(this.typingTotalChars);
    this.container.classList.remove('hiding');
    this.container.classList.add('visible');
    this.state = 'visible';
    this.dispatchMouth('default');
    this.options.onTypingEnd?.();
    this.scheduleAutoHide();
  }

  private hideInstant(): void {
    this.cancelTimers();
    this.removeViewportListeners();
    this.dispatchMouth('default');
    this.container.classList.remove('visible', 'hiding');
    this.container.style.display = 'none';
    this.state = 'hidden';
    this.typingApply = null;
    this.typingTotalChars = 0;
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
    this.options.onMouthShape?.(state);
    if (!this.avatarRoot) return;
    this.avatarRoot.dispatchEvent(
      new CustomEvent('avatar:set-mouth', { detail: { state }, bubbles: true }),
    );
  }


  /* ── Styles ────────────────────────────────────────── */

  private static CSS = `
    .avatar-speech-bubble {
      position: absolute;
      /* Capa padre en el body; z-index respecto al stacking del sitio */
      z-index: 0;
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

    /* When the viewport is tight (mobile) we may place the bubble above/below the avatar
       to avoid clamping it on top of the anchor. */
    .avatar-speech-bubble[data-side="top"] {
      transform-origin: center bottom;
      transform: translateY(-50%) scale(0.85) translateY(8px);
    }

    .avatar-speech-bubble[data-side="bottom"] {
      transform-origin: center top;
      transform: translateY(-50%) scale(0.85) translateY(-8px);
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

    .avatar-speech-bubble[data-side="left"].hiding {
      transform: translateY(-50%) scale(0.95) translateX(4px);
    }

    .avatar-speech-bubble[data-side="top"].hiding {
      transform: translateY(-50%) scale(0.95) translateY(4px);
    }

    .avatar-speech-bubble[data-side="bottom"].hiding {
      transform: translateY(-50%) scale(0.95) translateY(-4px);
    }

    .avatar-speech-bubble__inner {
      position: relative;
      max-width: min(280px, calc(100vw - 28px));
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      background: transparent;
      color: var(--bubble-fg);
      border-radius: var(--bubble-radius);
      padding: 10px 16px;
      font-family: Inter, var(--font-sans, system-ui, sans-serif);
      font-size: 16px;
      line-height: 1.45;
      white-space: normal;
      text-wrap: wrap;
      overflow-wrap: break-word;
      text-align: left;
      isolation: isolate;
      z-index: 0;
    }

    .avatar-speech-bubble__inner[data-compact='true'] {
      padding: 8px 14px;
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
      display: block;
      white-space: normal;
      overflow-wrap: anywhere;
      line-height: inherit;
      width: 100%;
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

    /* Tail when bubble is above/below the avatar (mobile fallback) */
    .avatar-speech-bubble[data-side="top"] .avatar-speech-bubble__tail {
      top: auto;
      bottom: var(--bubble-inset-y);
      left: 50%;
      right: auto;
      transform: translate(-50%, 35%) rotate(45deg) skewX(var(--bubble-skew));
    }

    .avatar-speech-bubble[data-side="bottom"] .avatar-speech-bubble__tail {
      top: var(--bubble-inset-y);
      left: 50%;
      right: auto;
      transform: translate(-50%, -35%) rotate(45deg) skewX(var(--bubble-skew));
    }

    /* Flip tail when bubble is on the left of the avatar */
    .avatar-speech-bubble[data-side="left"] .avatar-speech-bubble__tail {
      left: auto;
      right: var(--bubble-inset-x);
      transform: translate(20%, -50%) rotate(45deg) skewX(var(--bubble-skew));
    }

    /* Dark mode (set explicit fallbacks) */
    html.dark .avatar-speech-bubble {
      --bubble-bg: var(--color-text, #E8E4DD);
      --bubble-fg: var(--color-bg, #0F0F0E);
    }

    @media (max-width: 40rem) {
      .avatar-speech-bubble__inner {
        max-width: min(228px, calc(100vw - 24px));
        padding: 9px 14px;
        font-size: 0.875rem;
      }

      .avatar-speech-bubble__inner[data-compact='true'] {
        padding: 7px 12px;
      }
    }

    /* Reduced motion */
    @media (prefers-reduced-motion: reduce) {
      .avatar-speech-bubble,
      .avatar-speech-bubble.visible,
      .avatar-speech-bubble.hiding {
        transition: none !important;
      }

      .avatar-speech-bubble.visible {
        opacity: 1;
        transform: translateY(-50%);
      }
    }
  `;
}
