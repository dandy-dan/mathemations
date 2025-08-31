export default function createTranslatePolygonAnimation(
  ctx,
  polygon,
  startPos,
  endPos,
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

  function getTranslatedPoints(currentCentroid) {
    const dx = currentCentroid.x - centroid.x;
    const dy = currentCentroid.y - centroid.y;
    return points.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
  }

  function draw() {
    const currentCentroid = {
      x: startPos.x + (endPos.x - startPos.x) * progress,
      y: startPos.y + (endPos.y - startPos.y) * progress,
    };
    const translatedPoints = getTranslatedPoints(currentCentroid);

    ctx.save();
    ctx.globalAlpha = alpha;

    // Fill immediately
    ctx.fillStyle = finalFillStyle;
    ctx.beginPath();
    ctx.moveTo(translatedPoints[0].x, translatedPoints[0].y);
    for (let i = 1; i < translatedPoints.length; i++) ctx.lineTo(translatedPoints[i].x, translatedPoints[i].y);
    ctx.closePath();
    ctx.fill();

    // Draw edges
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(translatedPoints[0].x, translatedPoints[0].y);
    for (let i = 1; i < translatedPoints.length; i++) ctx.lineTo(translatedPoints[i].x, translatedPoints[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  function drawFinal() {
    const translatedPoints = getTranslatedPoints(endPos);
    ctx.save();
    ctx.globalAlpha = alpha;

    ctx.fillStyle = finalFillStyle;
    ctx.beginPath();
    ctx.moveTo(translatedPoints[0].x, translatedPoints[0].y);
    for (let i = 1; i < translatedPoints.length; i++) ctx.lineTo(translatedPoints[i].x, translatedPoints[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(translatedPoints[0].x, translatedPoints[0].y);
    for (let i = 1; i < translatedPoints.length; i++) ctx.lineTo(translatedPoints[i].x, translatedPoints[i].y);
    ctx.closePath();
    ctx.stroke();

    ctx.restore();
  }

  return { reset, update, draw, drawFinal };
}
