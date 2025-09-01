import createPolygonAnimation from '../modules/polygonAnimation.js';
import createGridAnimation from '../modules/gridAnimation.js';
import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createAnimationController from '../modules/animationController.js';

// --- Color palette (color-blind-friendly) ---
const COLORS = {
  rectStroke: '#1f77b4',   // rectangle border
  rectFill: '#dceeff',     // rectangle fill
  gridStroke: '#1f77b4',   // grid lines only
};

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const widthInput = document.getElementById('rectWidth');
const heightInput = document.getElementById('rectHeight');
const sizeInput = document.getElementById('squareSize');
const startBtn = document.getElementById('startButton');

let animationController = null;

// Keep canvas size fixed by resize listener
setupResizeListener(canvas, ctx, () => {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  if (animationController) {
    animationController.reset();
  }
});

function setupAnimations() {
  const W = Math.max(20, Number(widthInput.value) || 360);
  const H = Math.max(20, Number(heightInput.value) || 220);
  const S = Math.max(5, Number(sizeInput.value) || 40);

  const margin = 40;
  const scale = Math.min(
    1,
    (canvas.clientWidth - margin * 2) / W,
    (canvas.clientHeight - margin * 2) / H
  );

  const drawW = Math.round(W * scale);
  const drawH = Math.round(H * scale);

  // --- centroid at canvas center (CSS space) ---
  const canvasCx = canvas.clientWidth / 2 - canvas.clientWidth*0.05;
  const canvasCy = canvas.clientHeight / 2 - canvas.clientHeight*0.05;

  const rectX = canvasCx - drawW / 2;
  const rectY = canvasCy - drawH / 2;

  const rect = { x: rectX, y: rectY, width: drawW, height: drawH };

  const rectPoints = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.width, y: rect.y },
    { x: rect.x + rect.width, y: rect.y + rect.height },
    { x: rect.x, y: rect.y + rect.height },
  ];

  const polyAnim = createPolygonAnimation(ctx, rectPoints, 1200, {
    strokeStyle: COLORS.rectStroke,
    fillStyle: COLORS.rectFill,
    lineWidth: 0.5,
    fillDuration: 800,
    alpha: 1
  });

  const gridAnim = createGridAnimation(ctx, rect, Math.max(5, S * scale), 1400, {
    strokeStyle: COLORS.gridStroke,
    lineWidth: 0.5,
  });

  animationController = createAnimationController(ctx, [polyAnim, gridAnim]);
}

startBtn.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
  setupAnimations();
  animationController.start();
});
