type GlobalWindow = Window & typeof globalThis & {
  __baseClientInit?: boolean;
  __baseClientCleanup?: () => void;
  __glitchReducedMotionHandler?: (event: MediaQueryListEvent) => void;
  posthog?: { capture: (event: string, properties?: Record<string, unknown>) => void };
};

const win = window as GlobalWindow;

function setupBaseClient() {
  if (win.__baseClientInit) return;
  win.__baseClientInit = true;

  let themeSwitchTimer: number | null = null;
  let navAbortController: AbortController | null = null;

  function withInstantFolderThemeSwitch(fn: () => void) {
    const root = document.documentElement;
    root.setAttribute('data-theme-switching', 'true');
    if (themeSwitchTimer) window.clearTimeout(themeSwitchTimer);

    fn();

    themeSwitchTimer = window.setTimeout(() => {
      root.removeAttribute('data-theme-switching');
      themeSwitchTimer = null;
    }, 120);
  }

  function applyTheme() {
    const saved = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.documentElement.classList.toggle('dark', saved === 'dark' || (!saved && prefersDark));
  }

  function updateToggleIcons() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const isDark = document.documentElement.classList.contains('dark');
    const currentThemeLabel = isDark ? 'Tema oscuro activo' : 'Tema claro activo';
    toggle.setAttribute('aria-pressed', String(isDark));
    toggle.setAttribute('aria-label', currentThemeLabel);
    toggle.setAttribute('title', currentThemeLabel);
  }

  function initNavbarScroll() {
    navAbortController?.abort();
    navAbortController = new AbortController();

    const header = document.getElementById('site-header');
    const logo = document.getElementById('nav-logo');
    const links = document.getElementById('nav-links');
    if (!header || !logo || !links) return;

    const mql = window.matchMedia('(min-width: 1024px)');
    const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const reset = () => {
      (logo as HTMLElement).style.transition = 'none';
      (links as HTMLElement).style.transition = 'none';
      (logo as HTMLElement).style.transform = 'translateX(0)';
      (links as HTMLElement).style.transform = 'translateX(0)';
    };

    const handleViewportModeChange = () => {
      if (!mql.matches || reducedMotionMql.matches) reset();
    };

    handleViewportModeChange();
    mql.addEventListener?.('change', handleViewportModeChange, { signal: navAbortController.signal });
    reducedMotionMql.addEventListener?.('change', handleViewportModeChange, { signal: navAbortController.signal });

    let lastScrollY = 0;
    let isHidden = false;
    let rafId = 0;
    const threshold = 20;
    const navbarExtraOffset = 50;

    const getHiddenOffsets = () => ({
      logo: (logo as HTMLElement).offsetWidth + navbarExtraOffset,
      links: (links as HTMLElement).offsetWidth + navbarExtraOffset,
    });

    const applyHiddenTransform = () => {
      const offsets = getHiddenOffsets();
      (logo as HTMLElement).style.transform = `translateX(-${offsets.logo}px)`;
      (links as HTMLElement).style.transform = `translateX(${offsets.links}px)`;
    };

    const animate = () => {
      rafId = 0;

      if (!mql.matches || reducedMotionMql.matches) {
        reset();
        isHidden = false;
        lastScrollY = window.scrollY;
        return;
      }

      const scrollY = window.scrollY;
      const shouldHide = scrollY > threshold && scrollY > lastScrollY && scrollY > 0;
      const isBase = scrollY <= threshold;

      if (shouldHide && !isHidden) {
        applyHiddenTransform();
        (logo as HTMLElement).style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        (links as HTMLElement).style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
        isHidden = true;
      } else if (isHidden && isBase) {
        (logo as HTMLElement).style.transform = 'translateX(0)';
        (logo as HTMLElement).style.transition = 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)';
        (links as HTMLElement).style.transform = 'translateX(0)';
        (links as HTMLElement).style.transition = 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)';
        isHidden = false;
      }

      lastScrollY = scrollY;
    };

    const updateHiddenGeometry = () => {
      if (!isHidden || !mql.matches || reducedMotionMql.matches) return;
      applyHiddenTransform();
    };

    window.addEventListener(
      'scroll',
      () => {
        if (rafId) return;
        rafId = window.requestAnimationFrame(animate);
      },
      { passive: true, signal: navAbortController.signal }
    );
    window.addEventListener('resize', updateHiddenGeometry, { passive: true, signal: navAbortController.signal });
    void (document as any).fonts?.ready?.then(updateHiddenGeometry).catch(() => {});
  }

  function initGlitch() {
    const sequence = ['/', '-', '\\', '|', '/'];
    let tid: number | null = null;
    let resetTimer: number | null = null;
    let anim = false;
    const reducedMotionMql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const resetChars = (chars: NodeListOf<HTMLElement>) => {
      chars.forEach((ch) => {
        ch.textContent = ch.getAttribute('data-char') || '/';
      });
    };

    const wrapper = document.querySelector('.name-wrapper');
    const glitchChars = document.querySelectorAll<HTMLElement>('.glitch-char');
    const mobileBtn = document.getElementById('mobile-home-btn');
    const mobileGlitchChars = document.querySelectorAll<HTMLElement>('.mobile-glitch-char');
    const mobileNameNormal = mobileBtn?.querySelector<HTMLElement>('.name-normal') ?? null;
    const mobileNameHover = mobileBtn?.querySelector<HTMLElement>('.name-hover') ?? null;

    const resetVisualState = () => {
      if (tid) window.clearTimeout(tid);
      if (resetTimer) window.clearTimeout(resetTimer);
      tid = null;
      resetTimer = null;
      anim = false;
      resetChars(glitchChars);
      resetChars(mobileGlitchChars);
      mobileNameNormal?.classList.remove('is-glitching');
      mobileNameHover?.classList.remove('is-glitching');
    };

    const cycle = (chars: NodeListOf<HTMLElement>) => {
      if (anim || reducedMotionMql.matches) return;
      anim = true;
      let i = 0;
      let c = 0;

      const next = () => {
        if (reducedMotionMql.matches) {
          resetVisualState();
          return;
        }

        chars.forEach((ch) => {
          ch.textContent = sequence[i];
        });
        i = (i + 1) % sequence.length;

        if (i === 0) {
          c++;
          if (c >= 5) {
            resetVisualState();
            return;
          }
        }

        tid = window.setTimeout(next, 120);
      };

      next();
    };

    const handleReducedMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) resetVisualState();
    };

    if (win.__glitchReducedMotionHandler) {
      reducedMotionMql.removeEventListener?.('change', win.__glitchReducedMotionHandler);
    }

    win.__glitchReducedMotionHandler = handleReducedMotionChange;
    reducedMotionMql.addEventListener?.('change', handleReducedMotionChange);

    if (wrapper && glitchChars.length) {
      wrapper.addEventListener('mouseenter', () => {
        if (reducedMotionMql.matches) return;
        if (tid) window.clearTimeout(tid);
        anim = false;
        window.setTimeout(() => cycle(glitchChars), 250);
      });

      wrapper.addEventListener('mouseleave', resetVisualState);
    }

    if (mobileBtn && mobileGlitchChars.length && mobileBtn.dataset.glitchBound !== 'true') {
      mobileBtn.dataset.glitchBound = 'true';
      const isHome = mobileBtn.getAttribute('data-is-home') === 'true';

      if (isHome) {
        mobileBtn.addEventListener('click', (e) => {
          e.preventDefault();
          if (reducedMotionMql.matches) return;

          mobileNameNormal?.classList.add('is-glitching');
          mobileNameHover?.classList.add('is-glitching');
          cycle(mobileGlitchChars);

          resetTimer = window.setTimeout(() => {
            if (reducedMotionMql.matches) {
              resetVisualState();
              return;
            }
            mobileNameNormal?.classList.remove('is-glitching');
            mobileNameHover?.classList.remove('is-glitching');
          }, 4200);
        });
      } else {
        mobileBtn.addEventListener('click', () => {
          window.location.href = '/';
        });
      }
    }
  }

  function bindThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle || toggle.dataset.themeBound === 'true') return;
    toggle.dataset.themeBound = 'true';

    toggle.addEventListener('click', () => {
      withInstantFolderThemeSwitch(() => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateToggleIcons();
        win.posthog?.capture('theme_toggled', { theme: isDark ? 'dark' : 'light' });
      });
    });
  }

  let contactLinksBound = false;

  function bindContactLinks() {
    if (contactLinksBound) return;
    contactLinksBound = true;

    document.addEventListener('click', (event) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>('.footer-contact-link');
      if (!link) return;
      const href = link.getAttribute('href') || '';
      const platform = href.startsWith('mailto:') ? 'email' : href.includes('linkedin') ? 'linkedin' : href.includes('github') ? 'github' : 'unknown';
      win.posthog?.capture('contact_link_clicked', { platform, href });
    });
  }

  function init() {
    applyTheme();
    updateToggleIcons();
    initNavbarScroll();
    initGlitch();
    bindThemeToggle();
    bindContactLinks();
  }

  init();
  document.addEventListener('astro:page-load', init);

  win.__baseClientCleanup = () => {
    navAbortController?.abort();
    navAbortController = null;
  };

  window.addEventListener('astro:before-preparation', () => {
    win.__baseClientCleanup?.();
  });
}

setupBaseClient();

export {};
