declare global {
  interface Window {
    __projectLightboxLoaded?: boolean;
  }
}

const STYLE_ID = 'project-lightbox-styles';
const MOTION_EASE = 'cubic-bezier(0.645,0.045,0.355,1)';

type ActiveLightboxState = {
  frame: HTMLElement;
  parent: Node;
  nextSibling: ChildNode | null;
  placeholder: HTMLDivElement | null;
  sourceRect: DOMRect;
  sourceMediaRect: DOMRect;
  originalStyle: string | null;
};

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .lightbox-overlay{position:fixed;inset:0;z-index:250;opacity:0;pointer-events:none;overflow:hidden;isolation:isolate;background:radial-gradient(circle at 50% 50%,var(--lightbox-vignette) 0%,transparent 60%),var(--lightbox-core);backdrop-filter:blur(12px) saturate(.9) contrast(.96);-webkit-backdrop-filter:blur(12px) saturate(.9) contrast(.96);transition:opacity 240ms ease-out}
    .lightbox-overlay[data-open]{opacity:1;pointer-events:auto}
    html.dark .lightbox-overlay{backdrop-filter:blur(14px) saturate(1) contrast(.98);-webkit-backdrop-filter:blur(14px) saturate(1) contrast(.98)}
    .lightbox-overlay>span{position:absolute;inset:0;display:block;pointer-events:none}
    .lightbox-overlay__shade{opacity:.4;background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--color-text) 10%,transparent) 0%,transparent 24%),radial-gradient(circle at 50% 50%,var(--lightbox-shade-core) 0%,transparent 66%)}
    html.dark .lightbox-overlay__shade{opacity:.52;background:radial-gradient(circle at 50% 45%,color-mix(in srgb,var(--color-text) 8%,transparent) 0%,transparent 24%),radial-gradient(circle at 50% 50%,var(--lightbox-shade-core) 0%,transparent 68%)}
    .lightbox-overlay__shader{inset:-18%;filter:blur(78px) saturate(1.18);transform:translate3d(0,0,0) scale(1.04)}
    .lightbox-overlay__shader--a{opacity:.24;mix-blend-mode:screen;background:radial-gradient(42% 38% at 18% 28%,color-mix(in srgb,var(--lightbox-ink-1) 34%,transparent) 0%,transparent 68%),radial-gradient(34% 30% at 74% 20%,color-mix(in srgb,var(--lightbox-ink-2) 28%,transparent) 0%,transparent 72%),radial-gradient(38% 44% at 58% 78%,color-mix(in srgb,var(--lightbox-ink-3) 24%,transparent) 0%,transparent 70%);animation:lightboxLiquidDriftA 20s cubic-bezier(.37,0,.63,1) infinite alternate}
    .lightbox-overlay__shader--b{opacity:.18;mix-blend-mode:color-dodge;filter:blur(92px) saturate(1.25);background:radial-gradient(36% 34% at 26% 72%,color-mix(in srgb,var(--lightbox-ink-2) 24%,transparent) 0%,transparent 70%),radial-gradient(46% 40% at 68% 46%,color-mix(in srgb,var(--lightbox-ink-1) 18%,transparent) 0%,transparent 68%),conic-gradient(from 120deg at 50% 50%,transparent 0deg,color-mix(in srgb,var(--lightbox-ink-1) 14%,transparent) 90deg,transparent 175deg,color-mix(in srgb,var(--lightbox-ink-2) 12%,transparent) 250deg,transparent 360deg);animation:lightboxLiquidDriftB 26s cubic-bezier(.37,0,.63,1) infinite alternate}
    html.dark .lightbox-overlay__shader--a{opacity:.3}html.dark .lightbox-overlay__shader--b{opacity:.22;filter:blur(96px) saturate(1.32)}
    .lightbox-overlay__grain{inset:-30%;opacity:.03;mix-blend-mode:soft-light;background-image:radial-gradient(circle at 20% 20%,rgba(255,255,255,.9) 0 .7px,transparent 1px),radial-gradient(circle at 80% 30%,rgba(255,255,255,.65) 0 .7px,transparent 1px),radial-gradient(circle at 30% 80%,rgba(255,255,255,.65) 0 .7px,transparent 1px);background-size:24px 24px,31px 31px,27px 27px;animation:lightboxGrainDrift 16s linear infinite}
    .lightbox-close,.lightbox-nav{position:fixed;z-index:270;display:inline-flex;align-items:center;justify-content:center;border-radius:999px;border:1px solid color-mix(in srgb,var(--color-text) 18%,transparent);background:color-mix(in srgb,var(--color-bg) 72%,transparent);color:color-mix(in srgb,var(--color-text) 76%,transparent);opacity:0;pointer-events:none;cursor:pointer;box-shadow:0 10px 30px color-mix(in srgb,var(--color-text) 8%,transparent),inset 0 1px 0 color-mix(in srgb,var(--color-bg) 65%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);transition:opacity 180ms ease-out,color 150ms ease-out,border-color 150ms ease-out,background-color 150ms ease-out,transform 180ms cubic-bezier(.16,1,.3,1),box-shadow 150ms ease-out}
    .lightbox-close{top:1.25rem;right:1.25rem;width:2.75rem;height:2.75rem}.lightbox-nav{top:50%;width:3rem;height:3rem;transform:translateY(-50%)}.lightbox-nav--prev{left:clamp(1rem,4vw,3rem)}.lightbox-nav--next{right:clamp(1rem,4vw,3rem)}
    .lightbox-close[data-open],.lightbox-nav[data-open]{opacity:1;pointer-events:auto}.lightbox-close:hover,.lightbox-close:focus-visible,.lightbox-nav:hover,.lightbox-nav:focus-visible{border-color:color-mix(in srgb,var(--color-text) 30%,transparent);background:color-mix(in srgb,var(--color-bg) 52%,transparent);color:var(--color-text)}.lightbox-close:active{transform:scale(.96)}.lightbox-nav:active{transform:translateY(-50%) scale(.96)}
    [data-lightbox-active='true']{cursor:default;backface-visibility:hidden}[data-lightbox-active='true'] [data-figure-caption]{font-size:var(--lightbox-caption-size,14px);line-height:1.38;color:var(--color-text);padding-top:var(--lightbox-caption-gap,10px);max-width:100%;text-wrap:pretty;opacity:0;transform:translateY(6px);transition:opacity 160ms ease-out,transform 220ms cubic-bezier(.16,1,.3,1)}[data-lightbox-active='true'][data-lightbox-phase='open'] [data-figure-caption]{opacity:1;transform:translateY(0)}
    @keyframes lightboxLiquidDriftA{0%{transform:translate3d(-4%,-3%,0) scale(1.02);opacity:.14;filter:blur(68px) saturate(1.08)}50%{transform:translate3d(5%,-2%,0) scale(1.12) rotate(10deg);opacity:.18;filter:blur(82px) saturate(1.18)}100%{transform:translate3d(-3%,2%,0) scale(1.1) rotate(-3deg);opacity:.16;filter:blur(78px) saturate(1.1)}}
    @keyframes lightboxLiquidDriftB{0%{transform:translate3d(5%,-2%,0) scale(1.04);opacity:.1}50%{transform:translate3d(-5%,-1%,0) scale(1.06) rotate(-12deg);opacity:.11}100%{transform:translate3d(3%,4%,0) scale(1.12) rotate(-4deg);opacity:.15}}
    @keyframes lightboxGrainDrift{0%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4%,3%,0) scale(1.02)}100%{transform:translate3d(8%,6%,0) scale(1)}}
    @media (max-width:768px){.lightbox-nav{width:2.75rem;height:2.75rem}.lightbox-nav--prev{left:.75rem}.lightbox-nav--next{right:.75rem}}
    @media (prefers-reduced-motion:reduce){.lightbox-overlay,.lightbox-close,.lightbox-nav,[data-lightbox-active='true'] [data-figure-caption]{transition:none}.lightbox-overlay__shader,.lightbox-overlay__grain{animation:none}}
  `;
  document.head.appendChild(style);
}

function getFlipTransform(from: DOMRect, to: DOMRect) {
  const scale = from.width / Math.max(to.width, 1);
  return `translate3d(${from.left - to.left}px, ${from.top - to.top}px, 0) scale(${scale})`;
}

function getMediaRect(frame: HTMLElement) {
  return frame.querySelector<HTMLElement>('[data-figure-media]')?.getBoundingClientRect() ?? frame.getBoundingClientRect();
}

function getDestinationMediaRect(state: ActiveLightboxState, destinationRect: DOMRect) {
  const mediaOffsetX = state.sourceMediaRect.left - state.sourceRect.left;
  const mediaOffsetY = state.sourceMediaRect.top - state.sourceRect.top;
  return new DOMRect(
    destinationRect.left + mediaOffsetX,
    destinationRect.top + mediaOffsetY,
    state.sourceMediaRect.width,
    state.sourceMediaRect.height
  );
}

function setupProjectLightbox() {
  if (window.__projectLightboxLoaded) return;
  window.__projectLightboxLoaded = true;

  const figures = Array.from(document.querySelectorAll<HTMLElement>('[data-figure-root]'));
  const frames = figures
    .map((figure) => figure.querySelector<HTMLElement>('[data-figure-frame]'))
    .filter((frame): frame is HTMLElement => Boolean(frame));

  if (!frames.length) return;
  ensureStyles();

  let active: ActiveLightboxState | null = null;
  let overlay: HTMLDivElement | null = null;
  let closeButton: HTMLButtonElement | null = null;
  let prevButton: HTMLButtonElement | null = null;
  let nextButton: HTMLButtonElement | null = null;
  let onKeyDown: ((event: KeyboardEvent) => void) | null = null;
  let isAnimating = false;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function getOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.innerHTML = '<span class="lightbox-overlay__shade"></span><span class="lightbox-overlay__shader lightbox-overlay__shader--a"></span><span class="lightbox-overlay__shader lightbox-overlay__shader--b"></span><span class="lightbox-overlay__grain"></span>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', () => closeExpanded());
    return overlay;
  }

  function makeButton(className: string, label: string, html: string, onClick: () => void) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = className;
    button.setAttribute('aria-label', label);
    button.innerHTML = html;
    button.addEventListener('click', (event) => {
      event.stopPropagation();
      onClick();
    });
    document.body.appendChild(button);
    return button;
  }

  function getCloseButton() {
    if (closeButton) return closeButton;
    closeButton = makeButton(
      'lightbox-close',
      'Cerrar imagen',
      '<span aria-hidden="true"><svg width="14" height="14" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.25" stroke-linecap="round"/></svg></span>',
      () => closeExpanded()
    );
    return closeButton;
  }

  function ensureNavigationButtons() {
    if (!prevButton) {
      prevButton = makeButton(
        'lightbox-nav lightbox-nav--prev',
        'Imagen anterior',
        '<span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 5l-7 7 7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
        () => switchFrame(-1)
      );
    }
    if (!nextButton) {
      nextButton = makeButton(
        'lightbox-nav lightbox-nav--next',
        'Imagen siguiente',
        '<span aria-hidden="true"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span>',
        () => switchFrame(1)
      );
    }
  }

  function setControlsOpen(open: boolean) {
    const method = open ? 'setAttribute' : 'removeAttribute';
    closeButton?.[method]('data-open', '');
    if (frames.length > 1) {
      prevButton?.[method]('data-open', '');
      nextButton?.[method]('data-open', '');
    }
  }

  function getTargetWidth(frame: HTMLElement, sourceRect: DOMRect) {
    const media = frame.querySelector<HTMLElement>('[data-figure-media]');
    const mediaRect = media?.getBoundingClientRect();
    const aspect = mediaRect && mediaRect.width > 0 ? mediaRect.height / mediaRect.width : sourceRect.height / sourceRect.width;
    const isMobile = window.innerWidth < 768;
    const maxW = isMobile ? window.innerWidth * 0.92 : Math.min(window.innerWidth * 0.72, 900);
    const maxImageHeight = window.innerHeight * (isMobile ? 0.72 : 0.78);
    const widthByHeight = maxImageHeight / Math.max(aspect, 0.1);
    return Math.max(Math.min(sourceRect.width, maxW), Math.min(maxW, widthByHeight));
  }

  function getCaptionSize(sourceWidth: number, targetWidth: number) {
    const scale = Math.sqrt(targetWidth / Math.max(sourceWidth, 1));
    return Math.max(14, Math.min(17, 14 * scale));
  }

  function createPlaceholder(frame: HTMLElement, sourceRect: DOMRect) {
    const computed = getComputedStyle(frame);
    if (computed.position === 'absolute' || computed.position === 'fixed') return null;

    const placeholder = document.createElement('div');
    placeholder.className = 'lightbox-placeholder';
    placeholder.style.cssText = `width:${sourceRect.width}px;height:${sourceRect.height}px;visibility:hidden;pointer-events:none`;
    frame.parentNode?.insertBefore(placeholder, frame);
    return placeholder;
  }

  function restoreFrame(state: ActiveLightboxState, focus = true) {
    state.frame.classList.remove('is-flying');
    delete state.frame.dataset.lightboxActive;
    delete state.frame.dataset.lightboxPhase;
    state.frame.style.willChange = '';

    if (state.placeholder) {
      state.parent.insertBefore(state.frame, state.placeholder);
      state.placeholder.remove();
    } else {
      state.parent.insertBefore(state.frame, state.nextSibling);
    }

    if (state.originalStyle === null) {
      state.frame.removeAttribute('style');
    } else {
      state.frame.setAttribute('style', state.originalStyle);
    }

    if (focus) state.frame.focus();
  }

  function openExpanded(frame: HTMLElement, keepOverlay = false) {
    if (isAnimating) return;
    if (active?.frame === frame) return;
    if (active) {
      closeExpanded({ keepOverlay: true, focus: false, afterClose: () => openExpanded(frame, true) });
      return;
    }

    isAnimating = true;
    const sourceRect = frame.getBoundingClientRect();
    const sourceMediaRect = getMediaRect(frame);
    const parent = frame.parentNode;
    if (!parent) {
      isAnimating = false;
      return;
    }

    const state: ActiveLightboxState = {
      frame,
      parent,
      nextSibling: frame.nextSibling,
      placeholder: createPlaceholder(frame, sourceRect),
      sourceRect,
      sourceMediaRect,
      originalStyle: frame.getAttribute('style'),
    };
    active = state;

    const overlayElement = getOverlay();
    getCloseButton();
    ensureNavigationButtons();
    if (!keepOverlay) requestAnimationFrame(() => overlayElement.setAttribute('data-open', ''));

    const targetWidth = getTargetWidth(frame, sourceRect);
    const captionSize = getCaptionSize(sourceRect.width, targetWidth);

    document.body.appendChild(frame);
    frame.classList.add('is-flying');
    frame.dataset.lightboxActive = 'true';
    frame.dataset.lightboxPhase = 'source';
    frame.style.cssText = `position:fixed;left:-9999px;top:0;width:${targetWidth}px;margin:0;z-index:260;opacity:1;visibility:hidden;transform:none;transform-origin:top left;transition:none;transition-delay:0ms;pointer-events:auto`;
    frame.style.setProperty('--lightbox-caption-size', `${captionSize.toFixed(2)}px`);
    frame.style.setProperty('--lightbox-caption-gap', `${Math.max(8, Math.min(12, captionSize * 0.65)).toFixed(1)}px`);

    const targetHeight = frame.offsetHeight;
    const targetLeft = (window.innerWidth - targetWidth) / 2;
    const targetTop = Math.max(window.innerWidth < 768 ? 64 : 32, (window.innerHeight - targetHeight) / 2);

    frame.style.left = `${targetLeft}px`;
    frame.style.top = `${targetTop}px`;
    const targetMediaRect = getMediaRect(frame);
    frame.style.visibility = 'visible';
    frame.style.transform = getFlipTransform(sourceMediaRect, targetMediaRect);
    frame.style.willChange = 'transform';

    const duration = reduceMotion.matches ? '1ms' : '420ms';
    frame.getBoundingClientRect();
    requestAnimationFrame(() => {
      frame.dataset.lightboxPhase = 'moving';
      frame.style.transition = `transform ${duration} ${MOTION_EASE}`;
      frame.style.transform = 'translate3d(0,0,0) scale(1)';
      frame.addEventListener('transitionend', function onOpenEnd(event) {
        if (event.propertyName !== 'transform') return;
        frame.removeEventListener('transitionend', onOpenEnd);
        frame.style.willChange = '';
        frame.dataset.lightboxPhase = 'open';
        setControlsOpen(true);
        isAnimating = false;
      });
      if (reduceMotion.matches) {
        frame.dataset.lightboxPhase = 'open';
        setControlsOpen(true);
        isAnimating = false;
      }
    });

    onKeyDown = (event) => {
      if (event.key === 'Escape') closeExpanded();
      if (event.key === 'ArrowLeft') switchFrame(-1);
      if (event.key === 'ArrowRight') switchFrame(1);
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.paddingRight = `${window.innerWidth - document.documentElement.clientWidth}px`;
    document.documentElement.style.overflow = 'hidden';
  }

  function closeExpanded(options: { keepOverlay?: boolean; focus?: boolean; afterClose?: () => void } = {}) {
    if (!active || isAnimating) return;
    isAnimating = true;

    const state = active;
    active = null;
    const frame = state.frame;
    const destinationRect = state.placeholder?.getBoundingClientRect() ?? state.sourceRect;
    const currentMediaRect = getMediaRect(frame);
    const destinationMediaRect = getDestinationMediaRect(state, destinationRect);
    const duration = reduceMotion.matches ? '1ms' : '340ms';

    setControlsOpen(Boolean(options.keepOverlay));
    if (!options.keepOverlay) overlay?.removeAttribute('data-open');

    frame.dataset.lightboxPhase = 'moving';
    frame.style.willChange = 'transform';
    frame.style.transition = `transform ${duration} ${MOTION_EASE}`;
    frame.style.transform = getFlipTransform(destinationMediaRect, currentMediaRect);

    const finish = () => {
      restoreFrame(state, options.focus ?? true);
      document.documentElement.style.overflow = '';
      document.body.style.paddingRight = '';
      if (onKeyDown) {
        document.removeEventListener('keydown', onKeyDown);
        onKeyDown = null;
      }
      isAnimating = false;
      options.afterClose?.();
    };

    if (reduceMotion.matches) {
      requestAnimationFrame(finish);
      return;
    }

    frame.addEventListener('transitionend', function onCloseEnd(event) {
      if (event.propertyName !== 'transform') return;
      frame.removeEventListener('transitionend', onCloseEnd);
      finish();
    });
  }

  function switchFrame(direction: -1 | 1) {
    if (!active || frames.length <= 1 || isAnimating) return;
    const currentIndex = frames.indexOf(active.frame);
    const nextIndex = (currentIndex + direction + frames.length) % frames.length;
    const nextFrame = frames[nextIndex];
    closeExpanded({ keepOverlay: true, focus: false, afterClose: () => openExpanded(nextFrame, true) });
  }

  frames.forEach((frame, index) => {
    if (frame.dataset.lightboxReady === 'true') return;
    frame.dataset.lightboxReady = 'true';
    frame.style.transitionDelay ||= `${index * 150}ms`;
    frame.closest<HTMLElement>('[data-figure-root]')!.dataset.side ||= index % 2 === 0 ? 'right' : 'left';
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', 'Ampliar imagen');
    frame.addEventListener('click', () => openExpanded(frame));
    frame.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      openExpanded(frame);
    });
  });
}

setupProjectLightbox();

export {};
