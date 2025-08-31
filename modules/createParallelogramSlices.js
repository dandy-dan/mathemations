export default function createRectangleSlices(ctx, parallelogramPoints, slices = 20, options = {}) {
  const {
    strokeStyle = 'black',
    lineWidth = 1,
    fillStyle = 'rgba(0, 0, 255, 0.3)',
    alpha = 1,
  } = options;

  // Get base width from bottom of parallelogram
  const baseLeft = parallelogramPoints[3];  // bottom-left
  const baseRight = parallelogramPoints[2]; // bottom-right
  const baseWidth = baseRight.x - baseLeft.x;

  // Left edge line (top-left to bottom-left)
  const leftEdgeTop = parallelogramPoints[0];
  const leftEdgeBottom = parallelogramPoints[3];

  // Function to find X of left edge at a given t (0 = top, 1 = bottom)
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function leftXAtT(t) {
    return lerp(leftEdgeTop.x, leftEdgeBottom.x, t);
  }

  function yAtT(t) {
    return lerp(leftEdgeTop.y, leftEdgeBottom.y, t);
  }

  const slicesPolygons = [];
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;

    const yTop = yAtT(t0);
    const yBottom = yAtT(t1);

    const xLeftTop = leftXAtT(t0);
    const xLeftBottom = leftXAtT(t1);

    // We want a rectangle, so we take the average left position
    const avgLeftX = (xLeftTop + xLeftBottom) / 2;

    slicesPolygons.push([
      { x: avgLeftX, y: yTop },
      { x: avgLeftX + baseWidth, y: yTop },
      { x: avgLeftX + baseWidth, y: yBottom },
      { x: avgLeftX, y: yBottom }
    ]);
  }

  function drawSlice(polygon) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillStyle;

    ctx.beginPath();
    polygon.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function drawFinal() {
    slicesPolygons.forEach(drawSlice);
  }

  return {
    reset() {},
    update() { return true; },
    draw() {},
    drawFinal,
  };
}