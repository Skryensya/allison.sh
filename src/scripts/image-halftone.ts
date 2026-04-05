type HalftoneRuntimeState = {
  controllers: AbortController[];
  observers: Array<{ disconnect: () => void }>;
};

declare global {
  interface Window {
    __imageHalftoneLoaded?: boolean;
    __imageHalftoneCleanupBound?: boolean;
    __imageHalftoneState?: HalftoneRuntimeState;
  }
}

function setupImageHalftone() {
  if (typeof window === 'undefined') return;
  if (window.__imageHalftoneLoaded) return;
  window.__imageHalftoneLoaded = true;

  const state: HalftoneRuntimeState = (window.__imageHalftoneState ||= {
    controllers: [],
    observers: [],
  });

  function cleanup() {
    state.controllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        // noop
      }
    });
    state.controllers.length = 0;

    state.observers.forEach((o) => {
      try {
        o.disconnect();
      } catch {
        // noop
      }
    });
    state.observers.length = 0;
  }

  if (!window.__imageHalftoneCleanupBound) {
    window.__imageHalftoneCleanupBound = true;
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  function renderFigure(root: HTMLElement) {
    const img = root.querySelector('[data-halftone-img]');
    const canvas = root.querySelector('[data-halftone-canvas]');

    if (!(img instanceof HTMLImageElement)) return;
    if (!(canvas instanceof HTMLCanvasElement)) return;
    if (!img.complete || !img.naturalWidth || !img.naturalHeight) return;

    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));

    if (canvas.width !== width) canvas.width = width;
    if (canvas.height !== height) canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    const dotColor = getComputedStyle(root).getPropertyValue('--halftone-dot').trim() || '#111';

    const cellCss = Math.max(6, Math.min(10, rect.width / 36));
    const cell = Math.max(8, Math.round(cellCss * dpr));
    const cols = Math.max(1, Math.ceil(width / cell));
    const rows = Math.max(1, Math.ceil(height / cell));

    const sample = document.createElement('canvas');
    sample.width = cols;
    sample.height = rows;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    if (!sampleCtx) return;

    sampleCtx.drawImage(img, 0, 0, cols, rows);
    const { data } = sampleCtx.getImageData(0, 0, cols, rows);

    ctx.fillStyle = dotColor;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const i = (y * cols + x) * 4;
        const r = data[i] ?? 0;
        const g = data[i + 1] ?? 0;
        const b = data[i + 2] ?? 0;
        const a = data[i + 3] ?? 255;
        if (a < 10) continue;

        const luminance = (r * 0.2126 + g * 0.7152 + b * 0.0722) / 255;
        const darkness = 1 - luminance;
        if (darkness < 0.05) continue;

        const cx = x * cell + cell * 0.5;
        const cy = y * cell + cell * 0.5;
        const radius = Math.max(cell * 0.08, darkness * cell * 0.44);
        const alpha = 0.2 + darkness * 0.78;

        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.globalAlpha = 1;
  }

  function init() {
    const roots = document.querySelectorAll('[data-halftone-figure]');
    if (!roots.length) return;

    const ac = new AbortController();
    state.controllers.push(ac);

    const scheduleMap = new WeakMap<HTMLElement, number>();
    const scheduleRender = (root: HTMLElement) => {
      const existing = scheduleMap.get(root);
      if (existing) cancelAnimationFrame(existing);
      const raf = requestAnimationFrame(() => {
        scheduleMap.delete(root);
        renderFigure(root);
      });
      scheduleMap.set(root, raf);
    };

    roots.forEach((root) => {
      if (!(root instanceof HTMLElement)) return;
      if (root.dataset.halftoneInit === 'true') return;
      root.dataset.halftoneInit = 'true';

      const img = root.querySelector('[data-halftone-img]');
      if (!(img instanceof HTMLImageElement)) return;

      const onReady = () => scheduleRender(root);
      if (img.complete) onReady();
      else img.addEventListener('load', onReady, { once: true, signal: ac.signal });

      const ro = new ResizeObserver(() => scheduleRender(root));
      state.observers.push(ro);
      ro.observe(root);
    });

    const mo = new MutationObserver(() => {
      roots.forEach((root) => {
        if (root instanceof HTMLElement) scheduleRender(root);
      });
    });
    state.observers.push(mo);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'style'] });

    window.addEventListener(
      'resize',
      () => {
        roots.forEach((root) => {
          if (root instanceof HTMLElement) scheduleRender(root);
        });
      },
      { signal: ac.signal }
    );

    window.addEventListener(
      'load',
      () => {
        roots.forEach((root) => {
          if (root instanceof HTMLElement) scheduleRender(root);
        });
      },
      { once: true, signal: ac.signal }
    );

    void (document as any).fonts?.ready
      ?.then(() => {
        roots.forEach((root) => {
          if (root instanceof HTMLElement) scheduleRender(root);
        });
      })
      .catch(() => {});
  }

  const boot = () => init();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('astro:page-load', boot);
}

setupImageHalftone();

export {};
