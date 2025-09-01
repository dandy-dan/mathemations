import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import getTrapeziumCoords from '../modules/getTrapeziumCoords.js';
import createRotatePolygonAnimation from '../modules/rotatePolygonAnimation.js';
import createTranslatePolygonAnimation from '../modules/translatePolygonAnimation.js';
import drawArrow from '../modules/drawArrow.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sideAInput = document.getElementById('sideA');
const sideBInput = document.getElementById('sideB');
const heightInput = document.getElementById('height');
const angleInput = document.getElementById('angle');
const startButton = document.getElementById('startButton');

let controller;

// Utility: center trapezium on screen
function getBottomLeftPosition(sideA, verticalHeight) {
  const scale = window.devicePixelRatio || 1;
  const usableWidth = canvas.width / scale;
  const usableHeight = canvas.height / scale;

  // Shift everything left so both trapeziums fit
  const leftShift = 75; // tweak this number if needed

  return {
    x: usableWidth / 2 - sideA / 2 - leftShift,
    y: usableHeight / 2 + verticalHeight / 2
  };
}

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
    bottomLeft: getBottomLeftPosition(sideA, verticalHeight)
  };

  const trapeziumData = getTrapeziumCoords.getTrapeziumCoordsFromBottomLeft(trapeziumParams);

  // Step 1: original trapezium
  const trapeziumAnimation = createPolygonAnimation(ctx, trapeziumData.points, 1000, {
    strokeStyle: '#4477AA',
    fillStyle: '#88CCEE',
    lineWidth: 0.5,
    alpha: 1
  });

  // Step 2: copy next to original (moved further apart)
  const copyOffsetX = Math.min(canvas.width / (window.devicePixelRatio || 1) * 0.5, 250);
  const trapeziumCopyData = {
    points: trapeziumData.points.map(p => ({ x: p.x + copyOffsetX, y: p.y })),
    centroid: { x: trapeziumData.centroid.x + copyOffsetX, y: trapeziumData.centroid.y }
  };
  const trapeziumCopyAnimation = createPolygonAnimation(ctx, trapeziumCopyData.points, 1000, {
    strokeStyle: '#EE7733',
    fillStyle: '#EE7733',
    lineWidth: 0.5,
    alpha: 1
  });

  // Step 3: rotate copy 180°
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
    { strokeStyle: '#EE7733', fillStyle: '#EE7733', lineWidth: 0.5, alpha: 1 }
  );

  // Step 4: slide rotated trapezium to join original
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
    { strokeStyle: '#EE7733', fillStyle: '#EE7733', lineWidth: 0.5, alpha: 1 }
  );

  // Step 5: measurement lines
  function createMeasurementLinesAnimation(duration) {
    const heightLine = {
      from: trapeziumData.points[0],
      to: { x: trapeziumData.points[0].x, y: trapeziumData.points[3].y },
      color: '#000'
    };

    const sideALine = {
      from: trapeziumData.points[0],
      to: trapeziumData.points[1],
      color: '#000'
    };

    const sideBLine = {
      from: {
        x: targetCentroid.x + (rotatedCopyData.points[3].x - rotatedCopyData.centroid.x),
        y: targetCentroid.y + (rotatedCopyData.points[3].y - rotatedCopyData.centroid.y)
      },
      to: {
        x: targetCentroid.x + (rotatedCopyData.points[2].x - rotatedCopyData.centroid.x),
        y: targetCentroid.y + (rotatedCopyData.points[2].y - rotatedCopyData.centroid.y)
      },
      color: '#000'
    };

    const lines = [heightLine, sideALine, sideBLine];
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
        lines.forEach(line => {
          drawArrow(ctx, line.from.x, line.from.y, line.to.x, line.to.y, 2, line.color, 8);
        });
      }
    };
  }

  const measurementLinesAnimation = createMeasurementLinesAnimation(1000);

  // Step 6: remove copy, redraw original
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
      ctx.fillStyle = '#88CCEE';
      ctx.fill();
      ctx.strokeStyle = '#4477AA';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    },
    drawFinal: () => {}
  };

  // ===== Animation sequence =====
  const animations = [
    trapeziumAnimation,
    trapeziumCopyAnimation,
    rotateCopyAnimation,
    translateCopyAnimation,
    {
      reset: () => measurementLinesAnimation.reset(),
      update: (timestamp) => measurementLinesAnimation.update(timestamp),
      draw: (timestamp) => {
        trapeziumAnimation.drawFinal();
        translateCopyAnimation.drawFinal();
        measurementLinesAnimation.draw(timestamp);
      },
      drawFinal: () => {
        trapeziumAnimation.drawFinal();
        translateCopyAnimation.drawFinal();
        measurementLinesAnimation.drawFinal();
      }
    },
    {
      reset: () => {},
      update: () => true,
      draw: () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        trapeziumData.points.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        );
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
        trapeziumData.points.forEach((p, i) =>
          i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
        );
        ctx.closePath();
        ctx.fillStyle = '#88CCEE';
        ctx.fill();
        ctx.strokeStyle = '#4477AA';
        ctx.lineWidth = 0.5;
        ctx.stroke();
        measurementLinesAnimation.drawFinal();
      }
    }
  ];

  const completedMap = [[], [0], [0], [0], [0], [0]];

  controller = createAnimationController(ctx, animations, completedMap);
  controller.start();
}

startButton.addEventListener('click', initAnimation);
setupResizeListener(canvas, ctx, initAnimation);
