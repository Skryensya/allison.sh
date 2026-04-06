type FolderStackRuntimeState = {
  controllers: AbortController[];
  observers: Array<{ disconnect: () => void }>;
};

declare global {
  interface Window {
    __folderStackScriptLoaded?: boolean;
    __folderStackCleanupBound?: boolean;
    __folderStackState?: FolderStackRuntimeState;
  }
}

function setupFolderStacks() {
  if (typeof window === 'undefined') return;

  if (window.__folderStackScriptLoaded) return;
  window.__folderStackScriptLoaded = true;

  const state: FolderStackRuntimeState = (window.__folderStackState ||= {
    controllers: [],
    observers: [],
  });

  function cleanup() {
    state.controllers.forEach((c) => {
      try {
        c.abort();
      } catch {
        // ignore
      }
    });
    state.controllers.length = 0;

    state.observers.forEach((o) => {
      try {
        o.disconnect();
      } catch {
        // ignore
      }
    });
    state.observers.length = 0;
  }

  if (!window.__folderStackCleanupBound) {
    window.__folderStackCleanupBound = true;
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);
  }

  function init() {
    const stacks = document.querySelectorAll('[data-folder-stack]');
    if (!stacks.length) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const enableAutoActive = isMobile;

    stacks.forEach((stack) => {
      if (!(stack instanceof HTMLElement)) return;
      if (stack.dataset.stackInit === 'true') return;
      stack.dataset.stackInit = 'true';

      // --- Relax animation (run once per stack) ---
      stack.classList.add('is-pre');

      const reveal = () => {
        if (stack.dataset.inviewDone === 'true') return;
        stack.dataset.inviewDone = 'true';

        stack.classList.add('is-relaxing');

        // children are the LI items
        const count = stack.children.length;
        const total = 720 + Math.max(0, count - 1) * 75 + 80;
        window.setTimeout(() => {
          stack.classList.remove('is-relaxing');
          stack.classList.remove('is-pre');
          stack.classList.add('is-relaxed');
        }, total);
      };

      if (prefersReducedMotion || isMobile) {
        stack.classList.remove('is-pre');
        stack.classList.add('is-relaxed');
      } else {
        const rect = stack.getBoundingClientRect();
        const isInitiallyInView = rect.top < window.innerHeight && rect.bottom > 0;
        if (isInitiallyInView) requestAnimationFrame(reveal);

        const io = new IntersectionObserver(
          (entries) => {
            if (!entries.some((e) => e.isIntersecting)) return;
            io.disconnect();
            requestAnimationFrame(reveal);
          },
          {
            threshold: 0.12,
            rootMargin: '0px 0px -10% 0px',
          }
        );

        state.observers.push(io);
        io.observe(stack);
      }

      const items = Array.from(stack.children).filter((el): el is HTMLElement => el instanceof HTMLElement);
      if (!items.length) return;

      const ac = new AbortController();
      state.controllers.push(ac);

      // --- Lazy-load folder previews on first hover/focus ---
      function ensurePreviewLoaded(item: HTMLElement) {
        if (item.dataset.previewLoaded === 'true') return;
        const imgs = item.querySelectorAll('[data-folder-preview-img]');
        if (!imgs.length) return;

        imgs.forEach((img) => {
          if (!(img instanceof HTMLImageElement)) return;
          const src = img.dataset.src;
          if (!src) return;
          img.src = src;
        });

        item.dataset.previewLoaded = 'true';
      }

      const PREVIEW_OPEN_DELAY = isMobile ? 700 : 500;
      const previewableItems: HTMLElement[] = [];
      const previewOpenTimers = new Map<HTMLElement, number>();
      let activeItem: HTMLElement | null = null;

      const applyItemPreviewOpen = (item: HTMLElement) => {
        item.dataset.previewOpen = 'true';
        item.querySelectorAll('[data-preview-index]').forEach((el) => {
          if (el instanceof HTMLElement) el.dataset.previewOpen = 'true';
        });
      };

      const clearPreviewOpenTimer = (item: HTMLElement) => {
        const timer = previewOpenTimers.get(item);
        if (!timer) return;
        window.clearTimeout(timer);
        previewOpenTimers.delete(item);
      };

      const openItemPreview = (item: HTMLElement) => {
        if (item.dataset.previewOpen === 'true' || previewOpenTimers.has(item)) return;
        ensurePreviewLoaded(item);
        const timer = window.setTimeout(() => {
          previewOpenTimers.delete(item);
          applyItemPreviewOpen(item);
        }, PREVIEW_OPEN_DELAY);
        previewOpenTimers.set(item, timer);
      };

      const closeItemPreview = (item: HTMLElement) => {
        clearPreviewOpenTimer(item);
        item.dataset.previewOpen = 'false';
        delete item.dataset.hoveredPreview;
        item.querySelectorAll('[data-preview-index]').forEach((el) => {
          if (el instanceof HTMLElement) el.dataset.previewOpen = 'false';
        });
      };

      const clearActiveItem = () => {
        if (!activeItem) return;
        activeItem.dataset.active = 'false';
        closeItemPreview(activeItem);
        activeItem = null;
      };

      const setActiveItem = (item: HTMLElement) => {
        if (activeItem === item) {
          item.dataset.active = 'true';
          openItemPreview(item);
          return;
        }

        if (activeItem) {
          activeItem.dataset.active = 'false';
          closeItemPreview(activeItem);
        }

        activeItem = item;
        activeItem.dataset.active = 'true';
        openItemPreview(activeItem);
      };

      items.forEach((item) => {
        const hit = item.querySelector('[data-folder-hit]');
        if (!(hit instanceof HTMLElement)) return;

        const openPreview = () => {
          openItemPreview(item);
        };

        const clearHoveredPreview = () => {
          delete item.dataset.hoveredPreview;
        };

        const closePreview = () => {
          closeItemPreview(item);
        };

        if (item.querySelector('[data-preview-index]')) previewableItems.push(item);

        if (!isMobile) {
          item.querySelectorAll('[data-preview-index]').forEach((preview) => {
            if (!(preview instanceof HTMLElement)) return;
            const index = preview.dataset.previewIndex;
            if (!index) return;

            preview.addEventListener(
              'pointerenter',
              () => {
                openPreview();
                item.dataset.hoveredPreview = index;
              },
              { signal: ac.signal }
            );

            preview.addEventListener('pointerleave', clearHoveredPreview, { signal: ac.signal });
            preview.addEventListener(
              'focus',
              () => {
                openPreview();
                item.dataset.hoveredPreview = index;
              },
              { signal: ac.signal }
            );
            preview.addEventListener('blur', clearHoveredPreview, { signal: ac.signal });
          });
        }

        if (!isMobile) {
          hit.addEventListener('pointerenter', openPreview, { signal: ac.signal });
          hit.addEventListener('focus', openPreview, { signal: ac.signal });
        }


        if (!isMobile) {
          item.addEventListener(
            'pointerleave',
            (event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && item.contains(related)) return;
              closePreview();
            },
            { signal: ac.signal }
          );
        }

        if (!isMobile) {
          item.addEventListener(
            'focusout',
            (event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && item.contains(related)) return;
              closePreview();
            },
            { signal: ac.signal }
          );
        }
      });

      if (!enableAutoActive && previewableItems.length) {
        previewableItems.forEach((item) => {
          closeItemPreview(item);
          item.dataset.active = 'false';
        });
      }

      // --- Mobile: keep one folder “current” while scrolling ---
      if (!enableAutoActive) return;

      const activeCandidates = previewableItems.length ? previewableItems : items;
      if (!activeCandidates.length) return;

      const ACTIVE_LINE = 0.42;
      const MIN_VISIBLE_RATIO = 0.5;

      let metricsReady = false;
      let stackTop = 0;
      let stackBottom = 0;
      let itemTops: number[] = [];

      function clearActive() {
        clearActiveItem();
      }

      function setActive(item: HTMLElement) {
        setActiveItem(item);
      }

      function recalcMetrics() {
        const sy = window.scrollY || window.pageYOffset || 0;
        const rect = stack.getBoundingClientRect();
        stackTop = rect.top + sy;
        stackBottom = rect.bottom + sy;

        // offsetTop is cheap and ignores transforms (important during relax).
        itemTops = new Array(activeCandidates.length);
        for (let i = 0; i < activeCandidates.length; i++) {
          itemTops[i] = stackTop + activeCandidates[i].offsetTop;
        }

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

        // Binary search: last item whose top is above the activation line.
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

        setActive(activeCandidates[ans]);
      }

      let pickRaf = 0;
      function schedulePick() {
        if (pickRaf) return;
        pickRaf = window.requestAnimationFrame(() => {
          pickRaf = 0;
          pickActive();
        });
      }

      let recalcRaf = 0;
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

        // Coarse cull: if the stack is more than ~1 viewport away, do nothing.
        // (Avoids scheduling rAF while scrolling other sections.)
        if (sy + vh < stackTop - vh || sy > stackBottom + vh) {
          clearActive();
          return;
        }

        schedulePick();
      }

      // Recalc when layout changes (folder heights can change after hydration).
      const ro = new ResizeObserver(scheduleRecalc);
      state.observers.push(ro);
      ro.observe(stack);

      // Late layout shifts (fonts, etc.) can move the stack without resizing it.
      window.addEventListener('load', scheduleRecalc, { once: true, signal: ac.signal });
      void (document as any).fonts?.ready?.then(scheduleRecalc).catch(() => {});

      recalcMetrics();
      pickActive();

      ac.signal.addEventListener('abort', () => {
        previewOpenTimers.forEach((timer) => window.clearTimeout(timer));
        previewOpenTimers.clear();
      });

      window.addEventListener('scroll', onScroll, { passive: true, signal: ac.signal });
      window.addEventListener('resize', scheduleRecalc, { signal: ac.signal });
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

setupFolderStacks();

export {};
