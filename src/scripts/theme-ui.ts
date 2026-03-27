// Theme toggle & UI effects - client only
if (typeof window !== 'undefined') {
  (function () {
    var rafId: number | null = null;

    function applyTheme() {
      var saved = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.classList.toggle('dark', saved === 'dark' || (!saved && prefersDark));
    }

    function updateToggleText() {
      var toggle = document.getElementById('theme-toggle');
      if (!toggle) return;
      var darkSpan = toggle.querySelector('.dark-label');
      var lightSpan = toggle.querySelector('.light-label');
      if (darkSpan && lightSpan) {
        var isDark = document.documentElement.classList.contains('dark');
        darkSpan.style.setProperty('display', isDark ? 'inline' : 'none');
        lightSpan.style.setProperty('display', isDark ? 'none' : 'inline');
      }
    }

    function restoreScrollPosition() {
      var state = history.state;
      window.scrollTo(0, state && state.scrollY ? state.scrollY : 0);
    }

    function initLightOverlay() {
      var overlay = document.getElementById('light-overlay');
      if (!overlay) return;
      function update() { overlay.style.setProperty('opacity', '0.4'); }
      window.addEventListener('scroll', update, { passive: true });
      update();
    }

    function initTopFade() {
      const fade = document.getElementById('top-fade');
      if (!fade) return;
      let lastScrollY = window.scrollY;
      function update() {
        const scrollY = window.scrollY;
        fade.style.height = `${Math.min(scrollY, 200)}px`;
        lastScrollY = scrollY;
      }
      window.addEventListener('scroll', update, { passive: true });
      update();
    }

    function initBottomFade() {
      const fade = document.getElementById('bottom-fade');
      if (!fade) return;
      function update() {
        fade.style.height = `${Math.min(window.scrollY * 0.5, 200)}px`;
      }
      window.addEventListener('scroll', update, { passive: true });
      update();
    }

    function initNavbarScroll() {
      const header = document.getElementById('site-header');
      const logo = document.getElementById('nav-logo');
      const links = document.getElementById('nav-links');
      if (!header || !logo || !links) return;

      const overlay = document.createElement('div');
      overlay.id = 'header-click-blocker';
      overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;height:0;z-index:99;pointer-events:none;transition:height 0.25s ease-out;';
      document.body.appendChild(overlay);

      let lastScrollY = 0, isHidden = false, rafId: number | null = null;
      const threshold = 20;

      function animate() {
        const scrollY = window.scrollY;
        const shouldHide = scrollY > threshold && scrollY > lastScrollY && scrollY > 0;
        const isBase = scrollY <= threshold;

        if (shouldHide && !isHidden) {
          logo.style.transform = 'translateX(-130%)';
          logo.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
          links.style.transform = 'translateX(120%)';
          links.style.transition = 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)';
          setTimeout(() => { overlay.style.height = `${header.offsetHeight}px`; overlay.style.pointerEvents = 'auto'; }, 50);
          isHidden = true;
        } else if (isHidden && isBase) {
          overlay.style.pointerEvents = 'none';
          overlay.style.height = '0px';
          logo.style.transform = 'translateX(0)';
          logo.style.transition = 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)';
          links.style.transform = 'translateX(0)';
          links.style.transition = 'transform 0.15s cubic-bezier(0.2, 0, 0, 1)';
          isHidden = false;
        }
        lastScrollY = scrollY;
      }

      window.addEventListener('scroll', () => { if (rafId) cancelAnimationFrame(rafId); rafId = requestAnimationFrame(animate); }, { passive: true });
    }

    function init() {
      applyTheme();
      updateToggleText();
      restoreScrollPosition();
      initLightOverlay();
      initTopFade();
      initBottomFade();
      initNavbarScroll();

      document.getElementById('theme-toggle')?.addEventListener('click', () => {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateToggleText();
      });
    }

    init();
    document.addEventListener('astro:after-swap', init);
  })();
}
