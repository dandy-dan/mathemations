import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import createParallelogramSlices from '../modules/createParallelogramSlices.js';
import createSliceSlideAnimation from '../modules/sliceSlideAnimation.js';
import getParallelogramCoords from '../modules/getParallelogramCoords.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const baseInput = document.getElementById('base');
const heightInput = document.getElementById('height');
const angleInput = document.getElementById('angle');
const startButton = document.getElementById('startButton');

let controller;

function initAnimation() {
  const baseLength = parseFloat(baseInput.value);
  const verticalHeight = parseFloat(heightInput.value);
  const angleDeg = parseFloat(angleInput.value);

  ctx.clearRect(0, 0, canvas.width, canvas.height); // clear canvas

  const parallelogramPoints = getParallelogramCoords.getParallelogramCoordsFromBottomLeft({
    baseLength,
    verticalHeight,
    angleDeg,
    bottomLeft: { x: 150, y: 250 },
    canvasHeight: canvas.height
  });

  const rectanglePoints = getParallelogramCoords.getParallelogramCoordsFromBottomLeft({
    baseLength,
    verticalHeight,
    angleDeg: 90,
    bottomLeft: { x: 300, y: 250 },
  });

  const base = rectanglePoints[1].x - rectanglePoints[0].x;
  const height = rectanglePoints[0].y - rectanglePoints[3].y;
  const rectX = rectanglePoints[0].x;
  const rectY = rectanglePoints[3].y;
  const slicesCount = 30;

 const animations = [
  createPolygonAnimation(ctx, parallelogramPoints, 1500, { 
    strokeStyle: '#1f77b4', // blue
    lineWidth: 2 
  }),
  createPolygonAnimation(ctx, rectanglePoints, 1500, { 
    strokeStyle: '#ff7f0e', // orange
    lineWidth: 2 
  }),
  createParallelogramSlices(ctx, parallelogramPoints, slicesCount, { 
    fillStyle: 'rgba(31, 119, 180, 0.3)', 
    lineWidth: 1 
  }),
  createSliceSlideAnimation(ctx, parallelogramPoints, rectX, rectY, base, height, slicesCount, 4000, { 
    fillStyle: 'rgba(31, 119, 180, 0.3)', 
    lineWidth: 1 
  }),
];

  const completedMap = [
    [],
    [0],
    [0, 1, 2],
    [0, 1],
  ];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

// Button to restart animation with new parameters
startButton.addEventListener('click', () => {
  initAnimation();
});

// Resize listener
setupResizeListener(canvas, ctx, () => {
  initAnimation();
});
