type ProjectFolderStackRuntime = {
  controllers: AbortController[];
  observers: Array<{ disconnect: () => void }>;
};

declare global {
  interface Window {
    __projectFolderStackLoaded?: boolean;
    __projectFolderStackCleanupBound?: boolean;
    __projectFolderStackState?: ProjectFolderStackRuntime;
  }
}

function setupProjectFolderStacks() {
  if (typeof window === 'undefined') return;
  if (window.__projectFolderStackLoaded) return;
  window.__projectFolderStackLoaded = true;

  const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
  const mobileMql = window.matchMedia('(max-width: 768px)');

  const runtime: ProjectFolderStackRuntime = (window.__projectFolderStackState ||= {
    controllers: [],
    observers: [],
  });

  function cleanup() {
    runtime.controllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        // ignore
      }
    });
    runtime.controllers.length = 0;

    runtime.observers.forEach((o) => {
      try {
        o.disconnect();
      } catch {
        // ignore
      }
    });
    runtime.observers.length = 0;
  }

  if (!window.__projectFolderStackCleanupBound) {
    window.__projectFolderStackCleanupBound = true;
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  function init() {
    const stacks = document.querySelectorAll('[data-project-folder-stack]');
    if (!stacks.length) return;

    stacks.forEach((stack) => {
      if (!(stack instanceof HTMLElement)) return;
      if (stack.dataset.stackInit === 'true') return;
      stack.dataset.stackInit = 'true';

      const items = Array.from(stack.querySelectorAll('[data-project-folder-card]')).filter(
        (el): el is HTMLElement => el instanceof HTMLElement
      );
      if (!items.length) return;

      const ac = new AbortController();
      runtime.controllers.push(ac);

      const alwaysOpenPreviewsMobile =
        mobileMql.matches && stack.hasAttribute('data-always-open-previews-mobile');

      if (!reducedMotionMql.matches && !mobileMql.matches) {
        const rect = stack.getBoundingClientRect();
        const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!alreadyVisible) {
          stack.classList.add('is-pre');
        }

        const reveal = () => {
          if (stack.dataset.inviewDone === 'true') return;
          stack.dataset.inviewDone = 'true';

          if (alreadyVisible) {
            stack.classList.add('is-relaxed');
            return;
          }

          stack.classList.add('is-relaxing');

          const total = 720 + Math.max(0, items.length - 1) * 75 + 80;
          window.setTimeout(() => {
            stack.classList.remove('is-relaxing');
            stack.classList.remove('is-pre');
            stack.classList.add('is-relaxed');
          }, total);
        };

        if (alreadyVisible) {
          requestAnimationFrame(reveal);
        } else {
          const io = new IntersectionObserver(
            (entries) => {
              if (!entries.some((entry) => entry.isIntersecting)) return;
              io.disconnect();
              requestAnimationFrame(reveal);
            },
            { threshold: 0.12, rootMargin: '0px 0px -10% 0px' }
          );

          runtime.observers.push(io);
          io.observe(stack);
        }
      } else {
        stack.classList.remove('is-pre', 'is-relaxing');
        stack.classList.add('is-relaxed');
      }

      function ensurePreviewLoaded(item: HTMLElement) {
        if (item.dataset.previewLoaded === 'true') return;
        const imgs = item.querySelectorAll('[data-folder-preview-img]');
        if (!imgs.length) return;

        imgs.forEach((img) => {
          if (!(img instanceof HTMLImageElement)) return;
          const src = img.dataset.src;
          if (!src) return;
          if (img.dataset.srcset) img.srcset = img.dataset.srcset;
          if (img.dataset.sizes) img.sizes = img.dataset.sizes;
          img.src = src;
        });

        item.dataset.previewLoaded = 'true';
      }

      const openTimers = new Map<HTMLElement, number>();
      const closeTimers = new Map<HTMLElement, number>();
      const previewStateTimers = new Map<HTMLElement, number>();
      let activeItem: HTMLElement | null = null;

      const DESKTOP_OPEN_DELAY = reducedMotionMql.matches ? 0 : 120;
      const DESKTOP_CLOSE_SLIDE = reducedMotionMql.matches ? 0 : 150;
      const DESKTOP_ACTIVE_RELEASE = reducedMotionMql.matches ? 0 : 0;

      function clearOpenTimer(item: HTMLElement) {
        const timer = openTimers.get(item);
        if (!timer) return;
        window.clearTimeout(timer);
        openTimers.delete(item);
      }

      function clearCloseTimer(item: HTMLElement) {
        const timer = closeTimers.get(item);
        if (!timer) return;
        window.clearTimeout(timer);
        closeTimers.delete(item);
      }

      function clearPreviewStateTimer(item: HTMLElement) {
        const timer = previewStateTimers.get(item);
        if (!timer) return;
        window.clearTimeout(timer);
        previewStateTimers.delete(item);
      }

      function closePreview(item: HTMLElement) {
        clearOpenTimer(item);
        clearCloseTimer(item);
        clearPreviewStateTimer(item);

        item.dataset.previewOpen = 'false';

        if (!mobileMql.matches) {
          item.dataset.previewState = 'closing';

          const stateTimer = window.setTimeout(() => {
            previewStateTimers.delete(item);
            item.dataset.previewState = 'closed';
          }, DESKTOP_CLOSE_SLIDE);

          previewStateTimers.set(item, stateTimer);

          const timer = window.setTimeout(() => {
            closeTimers.delete(item);
            item.dataset.active = 'false';
          }, DESKTOP_ACTIVE_RELEASE);

          closeTimers.set(item, timer);
          return;
        }
      }

      function openPreview(item: HTMLElement) {
        if (!item.querySelector('[data-folder-preview-img]')) return;
        clearCloseTimer(item);
        clearPreviewStateTimer(item);

        if (item.dataset.previewOpen === 'true' || openTimers.has(item)) {
          if (!mobileMql.matches) {
            item.dataset.active = 'true';
            item.dataset.previewState = 'open';
          }
          return;
        }

        ensurePreviewLoaded(item);
        if (!mobileMql.matches) {
          item.dataset.active = 'true';
          item.dataset.previewState = 'opening';
        }
        const delay = mobileMql.matches ? 420 : DESKTOP_OPEN_DELAY;

        if (delay <= 0) {
          item.dataset.previewOpen = 'true';
          if (!mobileMql.matches) item.dataset.previewState = 'open';
          return;
        }

        clearOpenTimer(item);

        const timer = window.setTimeout(() => {
          openTimers.delete(item);
          item.dataset.previewOpen = 'true';
          if (!mobileMql.matches) item.dataset.previewState = 'open';
        }, delay);

        openTimers.set(item, timer);
      }

      function clearActive() {
        if (!activeItem) return;
        activeItem.dataset.active = 'false';
        closePreview(activeItem);
        activeItem = null;
      }

      function setActive(item: HTMLElement) {
        if (activeItem === item) {
          item.dataset.active = 'true';
          openPreview(item);
          return;
        }

        if (activeItem) {
          activeItem.dataset.active = 'false';
          closePreview(activeItem);
        }

        activeItem = item;
        activeItem.dataset.active = 'true';
        openPreview(activeItem);
      }

      items.forEach((item, index) => {
        item.style.setProperty('--i', String(index));
        if (alwaysOpenPreviewsMobile) {
          item.dataset.previewOpen = 'true';
          item.dataset.previewState = 'closed';
          item.dataset.active = 'true';
        } else {
          item.dataset.previewOpen = 'false';
          item.dataset.previewState = 'closed';
          item.dataset.active = 'false';
        }

        const link = item.querySelector('.project-folder-card__link');
        if (!(link instanceof HTMLElement)) return;

        if (!mobileMql.matches) {
          link.addEventListener('pointerenter', () => openPreview(item), { signal: ac.signal });
          link.addEventListener('focus', () => openPreview(item), { signal: ac.signal });

          item.addEventListener(
            'pointerleave',
            (event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && item.contains(related)) return;
              closePreview(item);
            },
            { signal: ac.signal }
          );

          item.addEventListener(
            'focusout',
            (event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && item.contains(related)) return;
              closePreview(item);
            },
            { signal: ac.signal }
          );
        }
      });

      if (!mobileMql.matches) {
        ac.signal.addEventListener('abort', () => {
          openTimers.forEach((timer) => window.clearTimeout(timer));
          openTimers.clear();
          closeTimers.forEach((timer) => window.clearTimeout(timer));
          closeTimers.clear();
          previewStateTimers.forEach((timer) => window.clearTimeout(timer));
          previewStateTimers.clear();
        });
        return;
      }

      if (alwaysOpenPreviewsMobile) {
        items.forEach((item) => {
          ensurePreviewLoaded(item);
          item.dataset.previewOpen = 'true';
          item.dataset.active = 'true';
        });
        return;
      }

      const ACTIVE_LINE = 0.42;
      const MIN_VISIBLE_RATIO = 0.5;
      let metricsReady = false;
      let stackTop = 0;
      let stackBottom = 0;
      let itemTops: number[] = [];

      function recalcMetrics() {
        const sy = window.scrollY || window.pageYOffset || 0;
        const rect = stack.getBoundingClientRect();
        stackTop = rect.top + sy;
        stackBottom = rect.bottom + sy;
        itemTops = items.map((item) => stackTop + item.offsetTop);
        metricsReady = true;
      }

      function visibleHeight(sy: number, vh: number) {
        return Math.max(0, Math.min(stackBottom, sy + vh) - Math.max(stackTop, sy));
      }

      function pickActive() {
        const vh = window.innerHeight || 0;
        const sy = window.scrollY || window.pageYOffset || 0;
        if (!vh) return;
        if (!metricsReady) recalcMetrics();

        if (visibleHeight(sy, vh) < vh * MIN_VISIBLE_RATIO) {
          clearActive();
          return;
        }

        const yDoc = sy + vh * ACTIVE_LINE;
        let lo = 0;
        let hi = itemTops.length - 1;
        let ans = 0;

        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          if (itemTops[mid] <= yDoc) {
            ans = mid;
            lo = mid + 1;
          } else {
            hi = mid - 1;
          }
        }

        setActive(items[ans]);
      }

      let pickRaf = 0;
      let recalcRaf = 0;

      function schedulePick() {
        if (pickRaf) return;
        pickRaf = window.requestAnimationFrame(() => {
          pickRaf = 0;
          pickActive();
        });
      }

      function scheduleRecalc() {
        if (recalcRaf) return;
        recalcRaf = window.requestAnimationFrame(() => {
          recalcRaf = 0;
          recalcMetrics();
          pickActive();
        });
      }

      function onScroll() {
        const vh = window.innerHeight || 0;
        const sy = window.scrollY || window.pageYOffset || 0;
        if (!vh) return;

        if (!metricsReady) {
          scheduleRecalc();
          return;
        }

        if (sy + vh < stackTop - vh || sy > stackBottom + vh) {
          clearActive();
          return;
        }

        schedulePick();
      }

      const ro = new ResizeObserver(scheduleRecalc);
      runtime.observers.push(ro);
      ro.observe(stack);

      window.addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
      window.addEventListener('resize', scheduleRecalc, { signal: ac.signal });
      window.addEventListener('load', scheduleRecalc, { once: true, signal: ac.signal });
      void (document as any).fonts?.ready?.then(scheduleRecalc).catch(() => {});

      ac.signal.addEventListener('abort', () => {
        openTimers.forEach((timer) => window.clearTimeout(timer));
        openTimers.clear();
      });

      recalcMetrics();
      pickActive();
    });
  }

  const boot = () => init();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  document.addEventListener('astro:page-load', boot);
}

setupProjectFolderStacks();

export {};
