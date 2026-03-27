// Glitch text effect for name
(function () {
  const wrapper = document.querySelector('.name-wrapper');
  const glitchChars = document.querySelectorAll('.glitch-char');
  const sequence = ['/', '-', '\\', '|', '/'];
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let isAnimating = false;

  function startCycle() {
    if (isAnimating) return;
    isAnimating = true;
    let i = 0;
    let cycles = 0;
    const maxCycles = 5;

    function animate() {
      glitchChars.forEach(char => {
        char.textContent = sequence[i];
      });
      i = (i + 1) % sequence.length;

      if (i === 0) {
        cycles++;
        if (cycles >= maxCycles) {
          clearInterval(intervalId!);
          intervalId = null;
          glitchChars.forEach(char => {
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

  wrapper?.addEventListener('mouseenter', () => {
    if (intervalId) clearTimeout(intervalId);
    isAnimating = false;
    setTimeout(startCycle, 250);
  });

  wrapper?.addEventListener('mouseleave', () => {
    if (intervalId) clearTimeout(intervalId);
    intervalId = null;
    isAnimating = false;
    glitchChars.forEach(char => {
      char.textContent = char.getAttribute('data-char') || '/';
    });
  });
})();
