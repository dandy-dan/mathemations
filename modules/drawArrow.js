export default function drawArrow(ctx, x1, y1, x2, y2, lineWidth = 2, color = 'red', arrowSize = 10) {
  // Draw main line
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Calculate angle of line
  const angle = Math.atan2(y2 - y1, x2 - x1);

  // Arrowhead at end
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - arrowSize * Math.cos(angle - Math.PI / 6), y2 - arrowSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - arrowSize * Math.cos(angle + Math.PI / 6), y2 - arrowSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

  // Arrowhead at start
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 + arrowSize * Math.cos(angle - Math.PI / 6), y1 + arrowSize * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x1 + arrowSize * Math.cos(angle + Math.PI / 6), y1 + arrowSize * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
}
