import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import getTriangleCoords from '../modules/getTriangleCoords.js';
import createRotatePolygonAnimation from '../modules/rotatePolygonAnimation.js';
import createTranslatePolygonAnimation from '../modules/translatePolygonAnimation.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sideAInput = document.getElementById('sideA');
const sideBInput = document.getElementById('sideB');
const angleInput = document.getElementById('angle');
const startButton = document.getElementById('startButton');

let controller = null;

// === Initialize animation based on current input values ===
function initAnimation() {
  const sideA = parseFloat(sideAInput.value);
  const sideB = parseFloat(sideBInput.value);
  const angleDeg = parseFloat(angleInput.value);

  const triangleParams = {
    sideA,
    sideB,
    angleDeg,
    bottomLeft: { x: 50, y: 250 }
  };

  const triangleDataRaw = getTriangleCoords.getTriangleCoordsFromBottomLeft(triangleParams);

  const triangleData = {
    points: triangleDataRaw.vertices,
    centroid: triangleDataRaw.centroid
  };

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // === Step 1: original triangle ===
  const triangleAnimation = createPolygonAnimation(ctx, triangleData.points, 1000, {
    strokeStyle: '#4477AA',
    fillStyle: '#88CCEE',
    lineWidth: 0.5,
    alpha: 1
  });

  // === Step 2: copy next to original ===
  const copyOffsetX = 250;
  const triangleCopyData = {
    points: triangleData.points.map(p => ({ x: p.x + copyOffsetX, y: p.y })),
    centroid: { x: triangleData.centroid.x + copyOffsetX, y: triangleData.centroid.y }
  };
  const triangleCopyAnimation = createPolygonAnimation(ctx, triangleCopyData.points, 1000, {
    strokeStyle: '#EE7733',
    fillStyle: '#FFDDCC',
    lineWidth: 0.5,
    alpha: 1
  });

  // === Step 3: rotate copy 180° ===
  const rotatedCopyData = {
    points: triangleCopyData.points.map(p => {
      const dx = p.x - triangleCopyData.centroid.x;
      const dy = p.y - triangleCopyData.centroid.y;
      return { x: triangleCopyData.centroid.x - dx, y: triangleCopyData.centroid.y - dy };
    }),
    centroid: { ...triangleCopyData.centroid }
  };

  const rotateCopyAnimation = createRotatePolygonAnimation(
    ctx,
    triangleCopyData,
    0,
    180,
    1000,
    { strokeStyle: '#EE7733', fillStyle: '#FFDDCC', lineWidth: 0.5, alpha: 1 }
  );

  // === Step 4: slide rotated triangle to join original ===
  const blueBottomRight = triangleData.points[1];
  const redTopVertex = rotatedCopyData.points[2];

  const dx = blueBottomRight.x - redTopVertex.x;
  const dy = blueBottomRight.y - redTopVertex.y;

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
    { strokeStyle: '#EE7733', fillStyle: '#FFDDCC', lineWidth: 0.5, alpha: 1 }
  );

  // === Step 5: remove the copy, redraw original triangle ===
  const removeCopyAnimation = {
    reset: () => {},
    update: () => true, // instantly complete
    draw: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw blue original triangle
      ctx.beginPath();
      triangleData.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
      );
      ctx.closePath();
      ctx.fillStyle = '#88CCEE';
      ctx.fill();
      ctx.strokeStyle = '#4477AA';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    },
    drawFinal: () => {}
  };

  // === Animation sequence ===
  const animations = [
    triangleAnimation,
    triangleCopyAnimation,
    rotateCopyAnimation,
    translateCopyAnimation,
    removeCopyAnimation
  ];

  const completedMap = [
    [], [0], [0], [0], [0]
  ];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

// === Button click to start the animation ===
startButton.addEventListener('click', initAnimation);

// === Resize listener ===
setupResizeListener(canvas, ctx, () => {
  if (controller) {
    controller.currentIndex = 0;
    controller.start();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});
