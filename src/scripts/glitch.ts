// Glitch text effect for name
(function () {
  const isHoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  
  const sequence = ['/', '-', '\\', '|', '/'];
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isAnimating = false;

  function startCycle(chars: NodeListOf<Element>) {
    if (isAnimating) return;
    isAnimating = true;
    let i = 0;
    let cycles = 0;
    const maxCycles = 5;

    function animate() {
      chars.forEach(char => {
        char.textContent = sequence[i];
      });
      i = (i + 1) % sequence.length;

      if (i === 0) {
        cycles++;
        if (cycles >= maxCycles) {
          clearInterval(intervalId!);
          intervalId = null;
          chars.forEach(char => {
            char.textContent = char.getAttribute('data-char') || '/';
          });
          isAnimating = false;
          return;
        }
      }
      intervalId = setTimeout(animate, 120);
    }

    animate();
  }

  // Desktop: hover effect with mouseenter
  if (isHoverDevice) {
    const wrapper = document.querySelector('.name-wrapper');
    const glitchChars = document.querySelectorAll('.glitch-char');

    wrapper?.addEventListener('mouseenter', () => {
      if (intervalId) clearTimeout(intervalId);
      isAnimating = false;
      setTimeout(() => startCycle(glitchChars), 250);
    });

    wrapper?.addEventListener('mouseleave', () => {
      if (intervalId) clearTimeout(intervalId);
      intervalId = null;
      isAnimating = false;
      glitchChars.forEach(char => {
        char.textContent = char.getAttribute('data-char') || '/';
      });
    });
  }

  // Mobile: click/tap on button triggers glitch on home page
  const mobileBtn = document.getElementById('mobile-home-btn');
  const mobileGlitchChars = document.querySelectorAll('.mobile-glitch-char');
  const mobileNameNormal = mobileBtn?.querySelector('.name-normal');
  const mobileNameHover = mobileBtn?.querySelector('.name-hover');

  if (mobileBtn && mobileGlitchChars.length > 0) {
    const isHome = mobileBtn.getAttribute('data-is-home') === 'true';

    if (isHome) {
      // On home page: trigger glitch animation on click
      mobileBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Visual transition (same as hover)
        if (mobileNameNormal && mobileNameHover) {
          mobileNameNormal.classList.add('is-glitching');
          mobileNameHover.classList.add('is-glitching');
        }

        // Start glitch animation
        startCycle(mobileGlitchChars);

        // Reset visual after animation
        setTimeout(() => {
          mobileNameNormal?.classList.remove('is-glitching');
          mobileNameHover?.classList.remove('is-glitching');
        }, 750);
      });
    } else {
      // On internal pages: just navigate to home (default button behavior)
      mobileBtn.setAttribute('type', 'button');
      mobileBtn.addEventListener('click', () => {
        window.location.href = '/';
      });
    }
  }
})();
