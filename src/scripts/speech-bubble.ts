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
  private avatarRect: DOMRect | null = null;

  constructor(options: SpeechBubbleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.container = document.createElement('div');
    this.container.className = 'speech-bubble';
    this.container.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: 10;
      display: none;
      opacity: 0;
      transform: translateY(6px);
      transition: opacity 0.25s ease, transform 0.25s ease;
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
          transform: translateY(0);
        }
        .speech-bubble.visible .cursor {
          display: none;
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Mount to a parent element (e.g., avatar wrapper)
   */
  mount(parent: HTMLElement): void {
    parent.appendChild(this.container);
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

  private position(textWidth: number, textHeight: number): void {
    if (!this.avatarRect) return;

    const gap = 12;
    const avatarCenterX = this.avatarRect.width / 2;
    const avatarTop = 0;

    // Center bubble above avatar
    let x = avatarCenterX - textWidth / 2 - this.avatarRect.left;
    let y = -textHeight - gap;

    // Clamp to parent bounds (with some padding)
    const maxX = 300;
    x = Math.max(-50, Math.min(x, maxX - textWidth));
    y = Math.min(y, -gap);

    this.container.style.left = `${x}px`;
    this.container.style.top = `${y}px`;
    this.container.style.width = 'auto';
    this.container.style.padding = '10px 16px';
    this.container.style.background = '#ffffff';
    this.container.style.borderRadius = '8px';
    this.container.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
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
      this.container.classList.add('visible');
      setTimeout(() => {
        this.cursorEl.style.display = 'none';
      }, 400);
      this.autoHideTimerId = window.setTimeout(() => this.hide(), this.options.displayDuration);
    }
  }

  show(text: string, avatarRect: DOMRect): void {
    this.clearAllTimers();
    this.avatarRect = avatarRect;

    this.fullText = text;
    this.displayedChars = 0;
    this.state = 'typing';

    const { width, height } = this.measureText(text);
    this.position(width, height);

    this.textEl.textContent = '';
    this.cursorEl.style.display = 'inline-block';
    this.container.classList.remove('visible');

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
