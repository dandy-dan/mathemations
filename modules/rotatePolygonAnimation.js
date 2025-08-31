export default function createRotatePolygonAnimation(
  ctx,
  polygon,
  startDeg,
  endDeg,
  duration = 2000,
  options = {}
) {
  let startTime = null;
  let progress = 0;
  let isDone = false;

  const { points, centroid } = polygon;
  const { strokeStyle = 'black', lineWidth = 2, alpha = 1, fillStyle } = options;

  function lightenColor(color, amount = 0.6) {
    if (!color.startsWith('#') || color.length !== 7) return color;
    const r = Math.floor(parseInt(color.substr(1,2),16) + (255 - parseInt(color.substr(1,2),16))*amount);
    const g = Math.floor(parseInt(color.substr(3,2),16) + (255 - parseInt(color.substr(3,2),16))*amount);
    const b = Math.floor(parseInt(color.substr(5,2),16) + (255 - parseInt(color.substr(5,2),16))*amount);
    return `rgb(${r},${g},${b})`;
  }
  const finalFillStyle = fillStyle || lightenColor(strokeStyle, 0.6);

  function reset() { startTime = null; progress = 0; isDone = false; }

  function update(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    progress = Math.min(elapsed / duration, 1);
    if (progress >= 1) { isDone = true; return true; }
    return false;
  }

  function getRotatedPoints(angleDeg) {
    const angleRad = (angleDeg * Math.PI) / 180;
    return points.map(({ x, y }) => {
      const dx = x - centroid.x;
      const dy = y - centroid.y;
      return {
        x: centroid.x + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
        y: centroid.y + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
      };
    });
  }

  function draw() {
    const currentAngle = startDeg + (endDeg - startDeg) * progress;
    const rotatedPoints = getRotatedPoints(currentAngle);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fill immediately
    ctx.fillStyle = finalFillStyle;
    ctx.beginPath();
    ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
    for (let i = 1; i < rotatedPoints.length; i++) ctx.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
    ctx.closePath();
    ctx.fill();

    // Draw edges
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
    for (let i = 1; i < rotatedPoints.length; i++) ctx.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  function drawFinal() {
    const rotatedPoints = getRotatedPoints(endDeg);
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = finalFillStyle;
    ctx.beginPath();
    ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
    for (let i = 1; i < rotatedPoints.length; i++) ctx.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(rotatedPoints[0].x, rotatedPoints[0].y);
    for (let i = 1; i < rotatedPoints.length; i++) ctx.lineTo(rotatedPoints[i].x, rotatedPoints[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  return { reset, update, draw, drawFinal, getRotatedPoints };
}