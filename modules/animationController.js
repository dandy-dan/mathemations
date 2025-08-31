export default function createAnimationController(ctx, animations, completedMap) {
  let currentIndex = 0;
  let running = false;

  // If no completedMap passed, create default cumulative map
  completedMap = completedMap || Array(animations.length + 1)
    .fill(0)
    .map((_, i) => Array.from({ length: i }, (_, j) => j));

  const backBtn = document.getElementById('stepBackwardButton');
  const forwardBtn = document.getElementById('stepForwardButton');

  // Disable step buttons initially
  if (backBtn) backBtn.disabled = true;
  if (forwardBtn) forwardBtn.disabled = true;

  function drawCompleted() {
    const indicesToDraw = completedMap[currentIndex] || [];
    indicesToDraw.forEach(i => {
      if (animations[i]) {
        animations[i].drawFinal();
      }
    });
  }

  function startCurrentAnimation() {
    running = true;
    animations[currentIndex].reset();
    requestAnimationFrame(runAnimation);

    // Enable step buttons once animation starts
    if (backBtn) backBtn.disabled = false;
    if (forwardBtn) forwardBtn.disabled = false;
  }

  function runAnimation(timestamp) {
    if (!running) return;
    const animation = animations[currentIndex];

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawCompleted();

    const done = animation.update(timestamp);
    animation.draw(timestamp);

    if (!done) {
      requestAnimationFrame(runAnimation);
    } else {
      animation.drawFinal();
      running = false;
    }
  }

  function nextAnimation() {
    if (currentIndex < animations.length - 1) {
      currentIndex++;
      startCurrentAnimation();
    }
  }

  function prevAnimation() {
    if (currentIndex > 0) {
      currentIndex--;
      startCurrentAnimation();
    }
  }

  // Attach event listeners to pre-existing buttons
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      if (!running) prevAnimation();
    });
  }

  if (forwardBtn) {
    forwardBtn.addEventListener('click', () => {
      if (!running) nextAnimation();
    });
  }

  return {
    start: startCurrentAnimation,
    next: nextAnimation,
    prev: prevAnimation,
    get currentIndex() {
      return currentIndex;
    },
    get running() {
      return running;
    },
  };
}
