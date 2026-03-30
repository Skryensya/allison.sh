import { prepareWithSegments, layoutWithLines } from '@chenglou/pretext';

export interface SpeechBubbleOptions {
  font?: string;
  maxWidth?: number;
  lineHeight?: number;
  typeSpeed?: number;
  displayDuration?: number;
}

const DEFAULT_OPTIONS: Required<SpeechBubbleOptions> = {
  font: '15px Inter, system-ui, sans-serif',
  maxWidth: 200,
  lineHeight: 24,
  typeSpeed: 30,
  displayDuration: 3000,
};

type BubbleState = 'hidden' | 'typing' | 'visible';

export class SpeechBubble {
  private container: HTMLDivElement;
  private textEl: HTMLSpanElement;
  private cursorEl: HTMLSpanElement;
  private options: Required<SpeechBubbleOptions>;
  private prepared: ReturnType<typeof prepareWithSegments> | null = null;
  private state: BubbleState = 'hidden';
  private displayedChars = 0;
  private fullText = '';
  private typeTimerId: number | null = null;
  private autoHideTimerId: number | null = null;
  private targetText = '';
  private buttonEl: HTMLElement | null = null;

  constructor(options: SpeechBubbleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.container = document.createElement('div');
    this.container.className = 'speech-bubble';
    this.container.style.cssText = `
      position: absolute;
      bottom: calc(100% + 12px);
      left: 50%;
      transform: translateX(-50%) translateY(6px);
      pointer-events: none;
      z-index: 10;
      display: none;
      opacity: 0;
      transition: opacity 0.25s ease, transform 0.25s ease;
      white-space: nowrap;
    `;

    this.textEl = document.createElement('span');
    this.textEl.style.cssText = `
      color: #1a1a1a;
      font-family: Inter, system-ui, sans-serif;
      font-size: 15px;
      line-height: 1.5;
    `;

    this.cursorEl = document.createElement('span');
    this.cursorEl.style.cssText = `
      display: inline-block;
      width: 2px;
      height: 1em;
      background: #1a1a1a;
      margin-left: 2px;
      vertical-align: text-bottom;
      animation: cursor-blink 0.8s ease-in-out infinite;
    `;

    this.textEl.appendChild(this.cursorEl);
    this.container.appendChild(this.textEl);

    if (!document.getElementById('speech-bubble-styles')) {
      const style = document.createElement('style');
      style.id = 'speech-bubble-styles';
      style.textContent = `
        @keyframes cursor-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .speech-bubble.show {
          opacity: 1;
          transform: translateX(-50%) translateY(0) !important;
        }
      `;
      document.head.appendChild(style);
    }
  }

  private measureText(text: string): { width: number; height: number } {
    if (!this.prepared || this.targetText !== text) {
      this.prepared = prepareWithSegments(text, this.options.font);
      this.targetText = text;
    }

    const { lines } = layoutWithLines(
      this.prepared,
      this.options.maxWidth,
      this.options.lineHeight
    );

    return {
      width: Math.max(...lines.map(l => l.width)),
      height: lines.length * this.options.lineHeight,
    };
  }

  private position(): void {
    const { width } = this.measureText(this.fullText);

    this.container.style.width = 'auto';
    this.container.style.maxWidth = `${this.options.maxWidth}px`;
    this.container.style.padding = '10px 16px';
    this.container.style.background = '#ffffff';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
    this.container.style.whiteSpace = 'normal';
  }

  private typeNextChar(): void {
    if (this.state !== 'typing') return;

    if (this.displayedChars < this.fullText.length) {
      this.displayedChars++;
      this.textEl.textContent = this.fullText.slice(0, this.displayedChars);
      this.textEl.appendChild(this.cursorEl);
      this.typeTimerId = window.setTimeout(() => this.typeNextChar(), this.options.typeSpeed);
    } else {
      this.state = 'visible';
      setTimeout(() => {
        this.cursorEl.style.display = 'none';
      }, 400);
      this.autoHideTimerId = window.setTimeout(() => this.hide(), this.options.displayDuration);
    }
  }

  show(text: string, buttonEl: HTMLElement): void {
    this.clearAllTimers();
    this.buttonEl = buttonEl;
    this.fullText = text;
    this.displayedChars = 0;
    this.state = 'typing';

    // Append to button if not already
    if (!this.container.parentElement) {
      buttonEl.appendChild(this.container);
    }

    this.position();

    this.textEl.textContent = '';
    this.cursorEl.style.display = 'inline-block';

    this.container.style.display = 'block';

    requestAnimationFrame(() => {
      this.container.classList.add('show');
    });

    this.typeTimerId = window.setTimeout(() => this.typeNextChar(), 100);
  }

  hide(): void {
    if (this.state === 'hidden') return;

    this.clearAllTimers();
    this.container.classList.remove('show');

    setTimeout(() => {
      this.container.style.display = 'none';
      this.state = 'hidden';
    }, 250);
  }

  private clearAllTimers(): void {
    if (this.typeTimerId) {
      clearTimeout(this.typeTimerId);
      this.typeTimerId = null;
    }
    if (this.autoHideTimerId) {
      clearTimeout(this.autoHideTimerId);
      this.autoHideTimerId = null;
    }
  }

  destroy(): void {
    this.clearAllTimers();
    this.container.remove();
  }
}
