type ProjectPageRuntime = {
  controller: AbortController | null;
  raf: number;
};

declare global {
  interface Window {
    __projectPageRuntime?: ProjectPageRuntime;
    __projectLightboxLoaded?: boolean;
    __setupProjectLightbox?: () => void;
  }
}

const runtime: ProjectPageRuntime = (window.__projectPageRuntime ||= {
  controller: null,
  raf: 0,
});

let projectLightboxPromise: Promise<unknown> | undefined;

function cleanup() {
  runtime.controller?.abort();
  runtime.controller = null;

  if (runtime.raf) {
    window.cancelAnimationFrame(runtime.raf);
    runtime.raf = 0;
  }
}

function loadProjectLightbox() {
  const url = document.documentElement.dataset.projectLightboxClientUrl;
  if (!url) return Promise.resolve();
  projectLightboxPromise ??= import(url);
  return projectLightboxPromise;
}

function initBlurUpImages(signal: AbortSignal) {
  const medias = document.querySelectorAll<HTMLElement>('[data-blur-up]');

  medias.forEach((media) => {
    const img = media.querySelector('img');
    if (!(img instanceof HTMLImageElement)) return;

    const markLoaded = () => {
      media.dataset.loaded = 'true';
    };

    if (img.complete && img.naturalWidth > 0) {
      markLoaded();
      return;
    }

    img.addEventListener('load', markLoaded, { once: true, signal });
  });
}

function initProjectGlow(signal: AbortSignal) {
  const shell = document.querySelector<HTMLElement>('[data-project-page-shell]');
  if (!shell) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let lastKey = '';

  function clamp(value: number, min: number, max: number) {
    return Math.min(max, Math.max(min, value));
  }

  function smoothstep(value: number) {
    const t = clamp(value, 0, 1);
    return t * t * (3 - 2 * t);
  }

  function setVar(name: string, value: string) {
    shell.style.setProperty(name, value);
  }

  function updateGlow() {
    runtime.raf = 0;

    if (reduceMotion.matches) {
      if (lastKey !== 'reduced') {
        lastKey = 'reduced';
        setVar('--project-page-glow-opacity', '0');
      }
      return;
    }

    const doc = document.documentElement;
    const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = clamp((window.scrollY || window.pageYOffset || 0) / maxScroll, 0, 1);
    const bucket = Math.round(progress * 1000);
    const isDark = doc.classList.contains('dark');
    const key = `${bucket}:${isDark ? 'dark' : 'light'}`;

    if (key === lastKey) return;
    lastKey = key;

    const p = bucket / 1000;
    const motion = smoothstep(p);
    const intensity = smoothstep(p * 0.92 + 0.04);
    const baseOpacity = isDark ? 0.12 : 0.12;
    const maxOpacity = isDark ? 0.42 : 0.48;

    setVar('--project-page-glow-opacity', (baseOpacity + intensity * (maxOpacity - baseOpacity)).toFixed(3));
    setVar('--project-page-glow-scale', (0.98 + motion * 0.09).toFixed(3));
    setVar('--project-page-glow-rise', `${(motion * -8).toFixed(2)}vh`);
    setVar('--project-page-glow-rise-soft', `${(motion * -4).toFixed(2)}vh`);
    setVar('--project-page-glow-drift', `${((motion - 0.5) * 24).toFixed(1)}px`);
    setVar('--project-page-glow-core-opacity', (isDark ? 0.42 + intensity * 0.12 : 0.48 + intensity * 0.16).toFixed(3));
    setVar('--project-page-glow-veil-opacity', (isDark ? 0.24 + intensity * 0.11 : 0.3 + intensity * 0.13).toFixed(3));
    setVar('--project-page-glow-lick-opacity', (isDark ? 0.18 + intensity * 0.1 : 0.24 + intensity * 0.11).toFixed(3));
  }

  function scheduleGlow(force = false) {
    if (!force && document.hidden) return;
    if (runtime.raf) return;
    runtime.raf = window.requestAnimationFrame(updateGlow);
  }

  updateGlow();
  window.addEventListener('scroll', () => scheduleGlow(false), { passive: true, signal });
  window.addEventListener('resize', () => scheduleGlow(true), { signal });
  reduceMotion.addEventListener?.('change', () => scheduleGlow(true), { signal });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleGlow(true);
  }, { signal });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('#theme-toggle')) return;
    window.setTimeout(() => scheduleGlow(true), 0);
  }, { signal });
}

function prepareProjectFigures(signal: AbortSignal) {
  const figures = document.querySelectorAll<HTMLElement>('[data-figure-root]');

  figures.forEach((fig, i) => {
    const frame = fig.querySelector<HTMLElement>('[data-figure-frame]');
    if (!frame) return;

    fig.dataset.side ||= i % 2 === 0 ? 'right' : 'left';
    frame.style.transitionDelay ||= `${i * 150}ms`;
    frame.setAttribute('tabindex', '0');
    frame.setAttribute('role', 'button');
    frame.setAttribute('aria-label', 'Ampliar imagen');

    if (frame.dataset.lightboxLoaderBound === 'true') return;
    frame.dataset.lightboxLoaderBound = 'true';

    const prime = (event: Event) => {
      if (frame.dataset.lightboxReady === 'true') return;

      let shouldReplay = event.type === 'click';
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        shouldReplay = true;
      }

      if (shouldReplay) event.preventDefault();
      void loadProjectLightbox().then(() => {
        window.__setupProjectLightbox?.();
        if (shouldReplay && frame.isConnected) frame.click();
      });
    };

    frame.addEventListener('pointerenter', prime, { passive: true, signal });
    frame.addEventListener('focus', prime, { passive: true, signal });
    frame.addEventListener('click', prime, { signal });
    frame.addEventListener('keydown', prime, { signal });
  });
}

function init() {
  cleanup();

  if (!document.querySelector('[data-project-page-shell], [data-figure-root], [data-blur-up]')) return;

  const controller = new AbortController();
  runtime.controller = controller;
  const { signal } = controller;

  initBlurUpImages(signal);
  window.requestAnimationFrame(() => {
    if (!signal.aborted) initBlurUpImages(signal);
  });
  initProjectGlow(signal);
  prepareProjectFigures(signal);
}

init();
document.addEventListener('astro:page-load', init);
window.addEventListener('astro:before-preparation', cleanup);
window.addEventListener('pagehide', cleanup);

export {};
