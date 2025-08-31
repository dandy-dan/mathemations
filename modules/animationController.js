export default function createAnimationController(ctx, animations, completedMap) {
  let currentIndex = 0;
  let running = false;

  // If no completedMap passed, create default cumulative map
  completedMap = completedMap || Array(animations.length + 1)
    .fill(0)
    .map((_, i) => Array.from({ length: i }, (_, j) => j));

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

  window.addEventListener('keydown', (e) => {
    if (!running) {
      if (e.key === 'ArrowRight') {
        nextAnimation();
      } else if (e.key === 'ArrowLeft') {
        prevAnimation();
      }
    }
  });

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