import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import getTrapeziumCoords from '../modules/getTrapeziumCoords.js';
import createRotatePolygonAnimation from '../modules/rotatePolygonAnimation.js';
import createTranslatePolygonAnimation from '../modules/translatePolygonAnimation.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sideAInput = document.getElementById('sideA');
const sideBInput = document.getElementById('sideB');
const heightInput = document.getElementById('height');
const angleInput = document.getElementById('angle');
const startButton = document.getElementById('startButton');

let controller;

// Helper: rotate a single point around a centroid
function getRotatedPoint(point, centroid, angleDeg) {
  const angleRad = (angleDeg * Math.PI) / 180;
  const dx = point.x - centroid.x;
  const dy = point.y - centroid.y;
  return {
    x: centroid.x + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
    y: centroid.y + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
  };
}

// Create the animation using current input values
function initAnimation() {
  const sideA = parseFloat(sideAInput.value);
  const sideB = parseFloat(sideBInput.value);
  const verticalHeight = parseFloat(heightInput.value);
  const angleDeg = parseFloat(angleInput.value);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const trapeziumParams = {
    sideA,
    sideB,
    verticalHeight,
    angleDeg,
    bottomLeft: { x: 50, y: 250 }
  };

  const trapeziumData = getTrapeziumCoords.getTrapeziumCoordsFromBottomLeft(trapeziumParams);

  // === Step 1: original trapezium ===
  const trapeziumAnimation = createPolygonAnimation(ctx, trapeziumData.points, 1000, {
    strokeStyle: '#4477AA', // accessible blue
    fillStyle: '#88CCEE',   // light blue fill
    lineWidth: 0.5,
    alpha: 1
  });

  // === Step 2: copy next to original ===
  const copyOffsetX = 250;
  const trapeziumCopyData = {
    points: trapeziumData.points.map(p => ({ x: p.x + copyOffsetX, y: p.y })),
    centroid: { x: trapeziumData.centroid.x + copyOffsetX, y: trapeziumData.centroid.y }
  };
  const trapeziumCopyAnimation = createPolygonAnimation(ctx, trapeziumCopyData.points, 1000, {
    strokeStyle: '#EE7733', // accessible orange
    lineWidth: 0.5,
    alpha: 1
  });

  // === Step 3: rotate copy 180° ===
  const rotatedCopyData = {
    points: trapeziumCopyData.points.map(p => {
      const dx = p.x - trapeziumCopyData.centroid.x;
      const dy = p.y - trapeziumCopyData.centroid.y;
      return { x: trapeziumCopyData.centroid.x - dx, y: trapeziumCopyData.centroid.y - dy };
    }),
    centroid: { ...trapeziumCopyData.centroid }
  };

  const rotateCopyAnimation = createRotatePolygonAnimation(
    ctx,
    trapeziumCopyData,
    0,
    180,
    1000,
    { strokeStyle: '#EE7733', lineWidth: 0.5, alpha: 1 }
  );

  // === Step 4: slide rotated trapezium to join original ===
  const blueBottomRight = trapeziumData.points[1];
  const redTopRight = rotatedCopyData.points[2];

  const dx = blueBottomRight.x - redTopRight.x;
  const dy = blueBottomRight.y - redTopRight.y;

  const targetCentroid = {
    x: rotatedCopyData.centroid.x + dx,
    y: rotatedCopyData.centroid.y + dy
  };

  const translateCopyAnimation = createTranslatePolygonAnimation(
    ctx,
    rotatedCopyData,
    rotatedCopyData.centroid,
    targetCentroid,
    1000,
    { strokeStyle: '#EE7733', lineWidth: 0.5, alpha: 1 }
  );

  // === Step 5: remove the copy, redraw original in same style ===
  const removeCopyAnimation = {
    reset: () => {},
    update: () => true,
    draw: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      trapeziumData.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.closePath();
      ctx.fillStyle = '#88CCEE';   // same as step 1
      ctx.fill();
      ctx.strokeStyle = '#4477AA'; // same as step 1
      ctx.lineWidth = 0.5;
      ctx.stroke();
    },
    drawFinal: () => {}
  };

  const animations = [
    trapeziumAnimation,
    trapeziumCopyAnimation,
    rotateCopyAnimation,
    translateCopyAnimation,
    removeCopyAnimation
  ];

  const completedMap = [[], [0], [0], [0], [0]];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

// Button click reads current input values
startButton.addEventListener('click', initAnimation);

// Resize listener also restarts with current inputs
setupResizeListener(canvas, ctx, initAnimation);
