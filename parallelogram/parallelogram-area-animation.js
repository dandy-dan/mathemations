import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import createSliceSlideAnimation from '../modules/sliceSlideAnimation.js';
import getParallelogramCoords from '../modules/getParallelogramCoords.js';
import drawArrow from '../modules/drawArrow.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const baseInput = document.getElementById('base');
const heightInput = document.getElementById('height');
const angleInput = document.getElementById('angle');
const slicesInput = document.getElementById('slices'); // new input
const startButton = document.getElementById('startButton');

let controller;

function initAnimation() {
  const baseLength = parseFloat(baseInput.value);
  const verticalHeight = parseFloat(heightInput.value);
  const angleDeg = parseFloat(angleInput.value);
  const slicesCount = parseInt(slicesInput.value) || 30;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Parallelogram coordinates
  const parallelogramPoints = getParallelogramCoords.getParallelogramCoordsFromBottomLeft({
    baseLength,
    verticalHeight,
    angleDeg,
    bottomLeft: { x: 225, y: 260 },
    canvasHeight: canvas.height
  });

  const rectX = parallelogramPoints[0].x;
  const rectY = parallelogramPoints[3].y;
  const base = parallelogramPoints[1].x - parallelogramPoints[0].x;
  const height = parallelogramPoints[0].y - parallelogramPoints[3].y;

  // Step 1: Parallelogram outline
  const parallelogramAnimation = createPolygonAnimation(ctx, parallelogramPoints, 1500, { 
    strokeStyle: '#b9e5ffff',
    lineWidth: 2,
    fillStyle: null
  });

  // Step 2: Progressive fill of slices inside parallelogram
  const slicesDynamic = createSliceSlideAnimation(
    ctx,
    parallelogramPoints,
    rectX, rectY,
    base, height,
    slicesCount,
    1500,
    { fillStyle: 'rgba(199, 254, 253, 0.8)', lineWidth: 0.5 } // 0.5px border
  );

  const step2Animation = {
    startTime: null,
    reset: () => { step2Animation.startTime = null; slicesDynamic.reset(); },
    update: timestamp => slicesDynamic.update(timestamp),
    draw: timestamp => slicesDynamic.drawSlicesBottomToTop(timestamp),
    drawFinal: () => slicesDynamic.drawSlicesInParallelogram()
  };

  // Step 3: Slide slices into rectangle while keeping parallelogram outline
  const slideSlicesAnimation = createSliceSlideAnimation(
    ctx,
    parallelogramPoints,
    rectX, rectY,
    base, height,
    slicesCount,
    4000,
    { fillStyle: 'rgba(199, 254, 253, 0.8)', lineWidth: 0.5 } // 0.5px border
  );

  const step3Animation = {
    startTime: null,
    reset: () => { step3Animation.startTime = null; slideSlicesAnimation.reset(); },
    update: timestamp => slideSlicesAnimation.update(timestamp),
    draw: timestamp => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parallelogramAnimation.drawFinal();
      slideSlicesAnimation.draw(timestamp);
    },
    drawFinal: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parallelogramAnimation.drawFinal();
      slideSlicesAnimation.drawFinal();
    }
  };

  // Step 4: Measurement arrows + final rectangle slices
  function createMeasurementLinesAnimation(duration) {
    const heightLine = { from: { x: rectX, y: rectY }, to: { x: rectX, y: rectY + height }, color: '#000000ff' };
    const baseLine = { from: { x: rectX, y: rectY + height }, to: { x: rectX + base, y: rectY + height }, color: '#000000ff' };
    const lines = [heightLine, baseLine];
    let startTime = null;

    return {
      reset: () => { startTime = null; },
      update: timestamp => {
        if (!startTime) startTime = timestamp;
        const t = Math.min((timestamp - startTime) / duration, 1);
        return t >= 1;
      },
      draw: timestamp => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        parallelogramAnimation.drawFinal();
        slideSlicesAnimation.drawFinal();
        if (!startTime) startTime = timestamp;
        const totalT = Math.min((timestamp - startTime) / duration, 1);
        const n = lines.length;
        lines.forEach((line, i) => {
          const startSeg = i / n;
          const endSeg = (i + 1) / n;
          let t = (totalT - startSeg) / (endSeg - startSeg);
          t = Math.max(0, Math.min(1, t));
          if (t > 0) {
            const x2 = line.from.x + (line.to.x - line.from.x) * t;
            const y2 = line.from.y + (line.to.y - line.from.y) * t;
            drawArrow(ctx, line.from.x, line.from.y, x2, y2, 2, line.color, 8);
          }
        });
      },
      drawFinal: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        parallelogramAnimation.drawFinal();
        slideSlicesAnimation.drawFinal();
        lines.forEach(line => drawArrow(ctx, line.from.x, line.from.y, line.to.x, line.to.y, 2, line.color, 8));
      }
    };
  }

  const measurementLinesAnimation = createMeasurementLinesAnimation(1000);

  const animations = [
    parallelogramAnimation,
    step2Animation,
    step3Animation,
    {
      reset: () => measurementLinesAnimation.reset(),
      update: timestamp => measurementLinesAnimation.update(timestamp),
      draw: timestamp => measurementLinesAnimation.draw(timestamp),
      drawFinal: () => measurementLinesAnimation.drawFinal()
    }
  ];

  const completedMap = [
    [],
    [0],
    [0,1],
    [0,1,2],
    [0,1,2]
  ];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

startButton.addEventListener('click', initAnimation);

setupResizeListener(canvas, ctx, () => {
  initAnimation();
});
