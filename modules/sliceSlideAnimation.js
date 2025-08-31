export default function createRectangleSliceSlideAnimation(
  ctx,
  parallelogramPoints,
  rectX,
  rectY,
  rectWidth,
  rectHeight,
  slices = 20,
  duration = 4000,
  options = {}
) {
  let startTime = null;
  let isDone = false;

  const {
    strokeStyle = 'black',
    lineWidth = 1,
    fillStyle = 'rgba(0, 0, 255, 0.3)',
    alpha = 1,
  } = options;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  // Parallelogram corners (bottomLeft → bottomRight → topRight → topLeft)
  const bottomLeft = parallelogramPoints[0];
  const bottomRight = parallelogramPoints[1];
  const topRight = parallelogramPoints[2];
  const topLeft = parallelogramPoints[3];

  // Base width (bottom edge length)
  const baseWidth = bottomRight.x - bottomLeft.x;

  // Helper functions to interpolate along left edge and vertical direction
  function leftXAtT(t) {
    return lerp(bottomLeft.x, topLeft.x, t);
  }
  function yAtT(t) {
    return lerp(bottomLeft.y, topLeft.y, t);
  }

  // 1. Initial slices inside parallelogram (with slanted left edge)
  const parallelogramSlices = [];
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;

    const yTop = yAtT(t0);
    const yBottom = yAtT(t1);

    const xLeftTop = leftXAtT(t0);
    const xLeftBottom = leftXAtT(t1);

    // Average to get slice’s left edge x coordinate (slanted)
    const avgLeftX = (xLeftTop + xLeftBottom) / 2;

    parallelogramSlices.push([
      { x: avgLeftX, y: yTop },
      { x: avgLeftX + baseWidth, y: yTop },
      { x: avgLeftX + baseWidth, y: yBottom },
      { x: avgLeftX, y: yBottom },
    ]);
  }

  // 2. Final target slices stacked vertically (rectangle slices)
  // Left edges all aligned vertically at bottom slice’s left edge X in rectangle
  const bottomSliceTargetLeftX = rectX;

  const sliceHeight = rectHeight / slices;

  const targetSlices = [];
  for (let i = 0; i < slices; i++) {
    const yTop = rectY + i * sliceHeight;
    const yBottom = yTop + sliceHeight;

    targetSlices.push([
      { x: bottomSliceTargetLeftX, y: yTop },                  // left-top
      { x: bottomSliceTargetLeftX + rectWidth, y: yTop },      // right-top
      { x: bottomSliceTargetLeftX + rectWidth, y: yBottom },   // right-bottom
      { x: bottomSliceTargetLeftX, y: yBottom },               // left-bottom
    ]);
  }

  // 3. Calculate horizontal shifts needed for each slice
  // Bottom slice shift = 0 (fixed)
  const shiftDistances = parallelogramSlices.map((slice) => {
    const initialLeftX = slice[0].x;
    return bottomSliceTargetLeftX - initialLeftX;
  });

  function reset() {
    startTime = null;
    isDone = false;
  }

  function update(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    if (elapsed >= duration) {
      isDone = true;
      return true;
    }
    return false;
  }

  // Draw polygon shifted horizontally by dx, vertical positions unchanged
  function drawShiftedPolygon(polygon, dx) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.fillStyle = fillStyle;

    ctx.beginPath();
    polygon.forEach((pt, i) => {
      const x = pt.x + dx;
      const y = pt.y;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function draw(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const sliceDuration = duration / slices;

    for (let i = 0; i < slices; i++) {
      const sliceStart = i * sliceDuration;
      let sliceProgress = (elapsed - sliceStart) / sliceDuration;
      sliceProgress = Math.min(Math.max(sliceProgress, 0), 1);

      // Animate horizontal shift from 0 to shiftDistances[i]
      const dx = shiftDistances[i] * sliceProgress;

      drawShiftedPolygon(parallelogramSlices[i], dx);
    }
  }

  function drawFinal() {
    for (let i = 0; i < slices; i++) {
      drawShiftedPolygon(parallelogramSlices[i], shiftDistances[i]);
    }
  }

  return {
    reset,
    update,
    draw,
    drawFinal,
  };
}