export default function createBlankAnimation() {
  return {
    reset() {
      // No state to reset
    },
    update(timestamp) {
      // Immediately finished
      return true;
    },
    draw() {
      // Nothing to draw
    },
    drawFinal() {
      // Nothing to draw
    }
  };
}