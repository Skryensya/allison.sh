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

  constructor(options: SpeechBubbleOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };

    this.container = document.createElement('div');
    this.container.className = 'speech-bubble';
    this.container.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: 9999;
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
        .talk-btn {
          position: relative;
          width: 32px;
          height: 32px;
          border: 2px solid #1a1a1a;
          border-radius: 50%;
          background: #ffffff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .talk-btn:hover {
          transform: scale(1.1);
          background: #f5f5f5;
        }
        .talk-btn:active {
          transform: scale(0.95);
        }
        .talk-btn svg {
          width: 16px;
          height: 16px;
        }
        .talk-btn.speaking {
          animation: talk-pulse 0.8s ease-in-out infinite;
        }
        @keyframes talk-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(this.container);
  }

  createTalkButton(avatarRect: DOMRect): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'talk-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Hablar');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    `;

    const x = avatarRect.right + 4;
    const y = avatarRect.bottom - 20;

    btn.style.position = 'fixed';
    btn.style.left = `${x}px`;
    btn.style.top = `${y}px`;
    btn.style.zIndex = '9998';

    btn.addEventListener('click', () => {
      btn.classList.add('speaking');
    });

    return btn;
  }

  markButtonDone(button: HTMLButtonElement): void {
    button.classList.remove('speaking');
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

  private position(avatarRect: DOMRect, textWidth: number, textHeight: number): void {
    const gap = 12;
    const avatarCenterX = avatarRect.left + avatarRect.width / 2;
    const avatarTop = avatarRect.top;

    let x = avatarCenterX - textWidth / 2;
    let y = avatarTop - textHeight - gap;

    x = Math.max(12, Math.min(x, window.innerWidth - textWidth - 32));
    y = Math.max(12, y);

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
      setTimeout(() => {
        this.cursorEl.style.display = 'none';
      }, 400);
      this.autoHideTimerId = window.setTimeout(() => this.hide(), this.options.displayDuration);
    }
  }

  show(text: string, avatarRect: DOMRect): void {
    this.clearAllTimers();

    this.fullText = text;
    this.displayedChars = 0;
    this.state = 'typing';

    const { width, height } = this.measureText(text);
    this.position(avatarRect, width, height);

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
