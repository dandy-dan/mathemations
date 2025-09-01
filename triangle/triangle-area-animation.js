import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import getTriangleCoords from '../modules/getTriangleCoords.js';
import createRotatePolygonAnimation from '../modules/rotatePolygonAnimation.js';
import createTranslatePolygonAnimation from '../modules/translatePolygonAnimation.js';
import drawArrow from '../modules/drawArrow.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sideAInput = document.getElementById('sideA');
const sideBInput = document.getElementById('sideB');
const angleInput = document.getElementById('angle');
const startButton = document.getElementById('startButton');

let controller = null;

// Correct perpendicular foot from top vertex to base line
function getPerpendicularFoot(top, baseLeft, baseRight) {
  const dx = baseRight.x - baseLeft.x;
  const dy = baseRight.y - baseLeft.y;
  const t = ((top.x - baseLeft.x) * dx + (top.y - baseLeft.y) * dy) / (dx * dx + dy * dy);
  return { x: baseLeft.x + t * dx, y: baseLeft.y + t * dy };
}

// Utility: get bottom-left position dynamically and shift left if needed
function getBottomLeftPosition(sideA, sideB) {
  const scale = window.devicePixelRatio || 1;
  const usableWidth = canvas.width / scale;
  const usableHeight = canvas.height / scale;

  const leftShift = 105; // shift triangles slightly left if needed
  return {
    x: usableWidth / 2 - sideA / 2 - leftShift,
    y: usableHeight / 2 + sideB / 2
  };
}

function initAnimation() {
  const sideA = parseFloat(sideAInput.value);
  const sideB = parseFloat(sideBInput.value);
  const angleDeg = parseFloat(angleInput.value);

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const triangleParams = {
    sideA,
    sideB,
    angleDeg,
    bottomLeft: getBottomLeftPosition(sideA, sideB)
  };

  const triangleDataRaw = getTriangleCoords.getTriangleCoordsFromBottomLeft(triangleParams);
  const triangleData = {
    points: triangleDataRaw.vertices,
    centroid: triangleDataRaw.centroid
  };

  // Step 1: original triangle
  const triangleAnimation = createPolygonAnimation(ctx, triangleData.points, 1000, {
    strokeStyle: '#4477AA',
    fillStyle: '#88CCEE',
    lineWidth: 0.5,
    alpha: 1
  });

  // Step 2: copy next to original (adjustable spacing)
  const copyOffsetX = Math.min(canvas.width / (window.devicePixelRatio || 1) * 0.45, 250); // smaller → closer
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

  // Step 3: rotate copy 180°
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

  // Step 4: slide rotated copy to join original
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

  // Step 5: measurement lines
  function createMeasurementLinesAnimation(duration) {
    const baseLeft = triangleData.points[0];
    const baseRight = triangleData.points[1];
    const topVertex = triangleData.points[2];
    const foot = getPerpendicularFoot(topVertex, baseLeft, baseRight);

    const heightLine = { from: topVertex, to: foot, color: '#0072B2' };
    const sideALine = { from: baseLeft, to: baseRight, color: '#009E73' };
    const lines = [heightLine, sideALine];
    let startTime = null;

    return {
      reset: () => { startTime = null; },
      update: timestamp => {
        if (!startTime) startTime = timestamp;
        const t = Math.min((timestamp - startTime) / duration, 1);
        return t >= 1;
      },
      draw: timestamp => {
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
        lines.forEach(line => drawArrow(ctx, line.from.x, line.from.y, line.to.x, line.to.y, 2, line.color, 8));
      }
    };
  }

  const measurementLinesAnimation = createMeasurementLinesAnimation(1000);

  // Step 6: remove copy, redraw original triangle but keep arrows
  const removeCopyAnimation = {
    reset: () => {},
    update: () => true,
    draw: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      triangleData.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = '#88CCEE';
      ctx.fill();
      ctx.strokeStyle = '#4477AA';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      measurementLinesAnimation.drawFinal();
    },
    drawFinal: () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
      triangleData.points.forEach((p, i) => i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = '#88CCEE';
      ctx.strokeStyle = '#4477AA';
      ctx.lineWidth = 0.5;
      ctx.fill();
      ctx.stroke();
      measurementLinesAnimation.drawFinal();
    }
  };

  // Animation sequence
  const animations = [
    triangleAnimation,
    triangleCopyAnimation,
    rotateCopyAnimation,
    translateCopyAnimation,
    {
      reset: () => measurementLinesAnimation.reset(),
      update: timestamp => measurementLinesAnimation.update(timestamp),
      draw: timestamp => {
        triangleAnimation.drawFinal();
        translateCopyAnimation.drawFinal();
        measurementLinesAnimation.draw(timestamp);
      },
      drawFinal: () => {
        triangleAnimation.drawFinal();
        translateCopyAnimation.drawFinal();
        measurementLinesAnimation.drawFinal();
      }
    },
    removeCopyAnimation
  ];

  const completedMap = [[], [0], [0], [0], [0], [0]];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

// Event listeners
startButton.addEventListener('click', initAnimation);
setupResizeListener(canvas, ctx, () => {
  if (controller) {
    controller.currentIndex = 0;
    controller.start();
  } else {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
});
