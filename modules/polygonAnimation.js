export default function createPolygonAnimation(ctx, points, duration = 2000, options = {}) {
  let startTime = null;
  let progress = 0;
  let isDone = false;

  const {
    strokeStyle = 'black',
    lineWidth = 2,
    alpha = 1,
    fillStyle = null,   // fill only if provided
    fillDuration = 1000
  } = options;

  function lightenColor(color, amount = 0.5) {
    if (!color.startsWith('#') || color.length !== 7) return color;
    const r = Math.floor(parseInt(color.substr(1,2),16) + (255 - parseInt(color.substr(1,2),16)) * amount);
    const g = Math.floor(parseInt(color.substr(3,2),16) + (255 - parseInt(color.substr(3,2),16)) * amount);
    const b = Math.floor(parseInt(color.substr(5,2),16) + (255 - parseInt(color.substr(5,2),16)) * amount);
    return `rgb(${r},${g},${b})`;
  }

  const finalFillStyle = fillStyle || lightenColor(strokeStyle, 0.6);

  function reset() {
    startTime = null;
    progress = 0;
    isDone = false;
  }

  function update(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;

    if (fillStyle) {
      progress = Math.min(elapsed / duration, 1 + fillDuration / duration);
    } else {
      progress = Math.min(elapsed / duration, 1); // no fill animation
    }

    if (progress >= (fillStyle ? 1 + fillDuration / duration : 1)) {
      isDone = true;
      return true;
    }
    return false;
  }

  function draw() {
    ctx.save();
    ctx.globalAlpha = alpha;

    // --- Draw edges ---
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    const totalSegments = points.length;
    const edgeProgress = Math.min(progress, 1) * totalSegments;
    const segmentsToDraw = Math.floor(edgeProgress);
    const partialSegmentProgress = edgeProgress - segmentsToDraw;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    for (let i = 1; i <= segmentsToDraw; i++) {
      ctx.lineTo(points[i % points.length].x, points[i % points.length].y);
    }

    if (segmentsToDraw < totalSegments) {
      const start = points[segmentsToDraw % points.length];
      const end = points[(segmentsToDraw + 1) % points.length];
      const x = start.x + (end.x - start.x) * partialSegmentProgress;
      const y = start.y + (end.y - start.y) * partialSegmentProgress;
      ctx.lineTo(x, y);
    }

    ctx.stroke();

    // --- Fill after edges (only if fillStyle provided) ---
    if (fillStyle && progress > 1) {
      const fillProgress = Math.min(progress - 1, 1); // 0 → 1 over fillDuration
      ctx.globalAlpha = alpha * fillProgress;
      ctx.fillStyle = finalFillStyle;
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
      ctx.closePath();
      ctx.fill();
    }

    ctx.restore();
  }

  function drawFinal() {
    ctx.save();
    ctx.globalAlpha = alpha;

    // Draw edges
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
    ctx.stroke();

    // Draw fill only if provided
    if (fillStyle) {
      ctx.fillStyle = finalFillStyle;
      ctx.fill();
    }

    ctx.restore();
  }

  return { reset, update, draw, drawFinal };
}
