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

  function resetDomState() {
    const stacks = document.querySelectorAll('[data-project-folder-stack]');
    stacks.forEach((stack) => {
      if (!(stack instanceof HTMLElement)) return;
      delete stack.dataset.stackInit;
      delete stack.dataset.inviewDone;
      stack.classList.remove('is-pre', 'is-relaxing', 'is-relaxed');

      const items = stack.querySelectorAll('[data-project-folder-card]');
      items.forEach((item) => {
        if (!(item instanceof HTMLElement)) return;
        item.dataset.active = 'false';
        item.dataset.previewOpen = 'false';
        item.dataset.previewState = 'closed';
      });
    });
  }

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

    resetDomState();
  }

  if (!window.__projectFolderStackCleanupBound) {
    window.__projectFolderStackCleanupBound = true;
    window.addEventListener('astro:before-preparation', cleanup);
    window.addEventListener('pagehide', cleanup);
    window.addEventListener('pageshow', () => {
      resetDomState();
      init();
    });
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
      const DESKTOP_ACTIVE_RELEASE = reducedMotionMql.matches ? 0 : 120;

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
        const item = activeItem;
        closePreview(item);
        if (mobileMql.matches) item.dataset.active = 'false';
        activeItem = null;
      }

      function setActive(item: HTMLElement) {
        if (activeItem === item) {
          item.dataset.active = 'true';
          openPreview(item);
          return;
        }

        if (activeItem) {
          const previousItem = activeItem;
          closePreview(previousItem);
          if (mobileMql.matches) previousItem.dataset.active = 'false';
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

      if (!('IntersectionObserver' in window)) {
        setActive(items[0]);
        return;
      }

      const activeCandidates = new Map<HTMLElement, number>();
      let selectRaf = 0;

      function selectActiveCandidate() {
        selectRaf = 0;

        let bestItem: HTMLElement | null = null;
        let bestScore = 0;
        activeCandidates.forEach((score, item) => {
          if (score <= bestScore) return;
          bestItem = item;
          bestScore = score;
        });

        if (bestItem) {
          setActive(bestItem);
        } else {
          clearActive();
        }
      }

      function scheduleSelectActiveCandidate() {
        if (selectRaf) return;
        selectRaf = window.requestAnimationFrame(selectActiveCandidate);
      }

      const activeObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!(entry.target instanceof HTMLElement)) return;
            if (entry.isIntersecting) {
              activeCandidates.set(entry.target, entry.intersectionRatio || 1);
            } else {
              activeCandidates.delete(entry.target);
            }
          });
          scheduleSelectActiveCandidate();
        },
        {
          root: null,
          rootMargin: '-38% 0px -46% 0px',
          threshold: [0, 0.2, 0.45, 0.7, 1],
        }
      );

      runtime.observers.push(activeObserver);
      items.forEach((item) => activeObserver.observe(item));

      ac.signal.addEventListener('abort', () => {
        openTimers.forEach((timer) => window.clearTimeout(timer));
        openTimers.clear();
        closeTimers.forEach((timer) => window.clearTimeout(timer));
        closeTimers.clear();
        previewStateTimers.forEach((timer) => window.clearTimeout(timer));
        previewStateTimers.clear();
        activeCandidates.clear();
        if (selectRaf) window.cancelAnimationFrame(selectRaf);
      });
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
