export default function createGridAnimation(ctx, rect, squareSize, duration = 2000, options = {}) {
  let startTime = null;
  let progress = 0;
  let isDone = false;

  const {
    strokeStyle = '#2B2B2B',    // grid lines color
    lineWidth = 2,
    alpha = 1,
  } = options;

  const cols = Math.ceil(rect.width / squareSize);
  const rows = Math.ceil(rect.height / squareSize);

  const lines = [];

  // Rectangle border lines (clockwise)
  lines.push({ start: { x: rect.x, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y } }); // top
  lines.push({ start: { x: rect.x + rect.width, y: rect.y }, end: { x: rect.x + rect.width, y: rect.y + rect.height } }); // right
  lines.push({ start: { x: rect.x + rect.width, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y + rect.height } }); // bottom
  lines.push({ start: { x: rect.x, y: rect.y + rect.height }, end: { x: rect.x, y: rect.y } }); // left

  // Vertical grid lines inside
  for (let i = 1; i < cols; i++) {
    const x = rect.x + i * squareSize;
    if (x >= rect.x + rect.width) continue;
    lines.push({ start: { x, y: rect.y }, end: { x, y: rect.y + rect.height } });
  }

  // Horizontal grid lines inside
  for (let i = 1; i < rows; i++) {
    const y = rect.y + i * squareSize;
    if (y >= rect.y + rect.height) continue;
    lines.push({ start: { x: rect.x, y }, end: { x: rect.x + rect.width, y } });
  }

  const totalLines = lines.length;

  function reset() {
    startTime = null;
    progress = 0;
    isDone = false;
  }

  function update(timestamp) {
    if (startTime === null) startTime = timestamp;
    const elapsed = timestamp - startTime;
    progress = Math.min(elapsed / duration, 1);

    if (progress >= 1) {
      isDone = true;
      return true;
    }
    return false;
  }

  function draw() {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    const linesToDraw = Math.floor(progress * totalLines);
    const partialLineProgress = (progress * totalLines) - linesToDraw;

    ctx.beginPath();
    for (let i = 0; i < linesToDraw; i++) {
      const line = lines[i];
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
    }

    if (linesToDraw < totalLines) {
      const line = lines[linesToDraw];
      const x = line.start.x + (line.end.x - line.start.x) * partialLineProgress;
      const y = line.start.y + (line.end.y - line.start.y) * partialLineProgress;
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(x, y);
    }

    ctx.stroke();
    ctx.restore();
  }

  function drawFinal() {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = strokeStyle;
    ctx.lineWidth = lineWidth;

    ctx.beginPath();
    for (let line of lines) {
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
    }
    ctx.stroke();
    ctx.restore();
  }

  return {
    reset,
    update,
    draw,
    drawFinal,
  };
}
