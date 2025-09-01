export default function createSliceSlideAnimation(
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
    lineWidth = 0.5, // changed from 1 to 0.5
    fillStyle = 'rgba(0, 0, 255, 0.3)',
    alpha = 1,
  } = options;

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  const bottomLeft = parallelogramPoints[0];
  const bottomRight = parallelogramPoints[1];
  const topRight = parallelogramPoints[2];
  const topLeft = parallelogramPoints[3];

  const baseWidth = bottomRight.x - bottomLeft.x;

  function leftXAtT(t) {
    return lerp(bottomLeft.x, topLeft.x, t);
  }
  function yAtT(t) {
    return lerp(bottomLeft.y, topLeft.y, t);
  }

  // Original slices inside parallelogram
  const parallelogramSlices = [];
  for (let i = 0; i < slices; i++) {
    const t0 = i / slices;
    const t1 = (i + 1) / slices;
    const yTop = yAtT(t0);
    const yBottom = yAtT(t1);
    const xLeftTop = leftXAtT(t0);
    const xLeftBottom = leftXAtT(t1);
    const avgLeftX = (xLeftTop + xLeftBottom) / 2;

    parallelogramSlices.push([
      { x: avgLeftX, y: yTop },
      { x: avgLeftX + baseWidth, y: yTop },
      { x: avgLeftX + baseWidth, y: yBottom },
      { x: avgLeftX, y: yBottom },
    ]);
  }

  // Target rectangle slices
  const sliceHeight = rectHeight / slices;
  const targetSlices = [];
  for (let i = 0; i < slices; i++) {
    const yTop = rectY + i * sliceHeight;
    const yBottom = yTop + sliceHeight;
    targetSlices.push([
      { x: rectX, y: yTop },
      { x: rectX + rectWidth, y: yTop },
      { x: rectX + rectWidth, y: yBottom },
      { x: rectX, y: yBottom },
    ]);
  }

  const shiftDistances = parallelogramSlices.map(
    slice => rectX - slice[0].x
  );

  function drawPolygon(polygon, dx = 0) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth; // now 0.5
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

  function drawSlicesInParallelogram() {
    parallelogramSlices.forEach(slice => drawPolygon(slice, 0));
  }

  function drawSlicesBottomToTop(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const sliceDuration = duration / slices;

    for (let i = 0; i < slices; i++) {
      const sliceStart = i * sliceDuration;
      let sliceProgress = (elapsed - sliceStart) / sliceDuration;
      sliceProgress = Math.min(Math.max(sliceProgress, 0), 1);

      if (sliceProgress > 0) {
        drawPolygon(parallelogramSlices[i], 0);
      }
    }

    if (elapsed >= duration) {
      isDone = true;
    }
  }

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

  function draw(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    const sliceDuration = duration / slices;

    for (let i = 0; i < slices; i++) {
      const sliceStart = i * sliceDuration;
      let sliceProgress = (elapsed - sliceStart) / sliceDuration;
      sliceProgress = Math.min(Math.max(sliceProgress, 0), 1);

      const dx = shiftDistances[i] * sliceProgress;
      drawPolygon(parallelogramSlices[i], dx);
    }
  }

  function drawFinal() {
    for (let i = 0; i < slices; i++) {
      drawPolygon(parallelogramSlices[i], shiftDistances[i]);
    }
  }

  return {
    reset,
    update,
    draw,
    drawFinal,
    drawSlicesInParallelogram,
    drawSlicesBottomToTop,
  };
}
