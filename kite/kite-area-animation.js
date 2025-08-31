import setupResizeListener from '../modules/fixBlurryCanvas.js';
import createPolygonAnimation from '../modules/polygonAnimation.js';
import createAnimationController from '../modules/animationController.js';
import kiteUtils from '../modules/getKiteCoords.js';
import splitKiteModule from '../modules/splitKiteIntoTriangles.js';
import { getTriangleCentroid } from '../modules/getTriangleCoords.js';
import createRotatePolygonAnimation from '../modules/rotatePolygonAnimation.js';
import createTranslatePolygonAnimation from '../modules/translatePolygonAnimation.js';
import drawArrow from '../modules/drawArrow.js';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const sideAInput = document.getElementById('sideA');
const sideBInput = document.getElementById('sideB');
const apexAngleInput = document.getElementById('apexAngle');
const startButton = document.getElementById('startButton');

let controller;

function initAnimation() {
  const sideA = parseFloat(sideAInput.value);
  const sideB = parseFloat(sideBInput.value);
  const apexAngleDeg = parseFloat(apexAngleInput.value);
  const duration = 1000;
  const spacing = 150;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const originalCenter = { x: 120, y: 200 };
  const originalKite = kiteUtils.getKiteCoords({
    sideA,
    sideB,
    apexAngleDeg,
    centroid: originalCenter
  });
  const copyCenter = {
    x: Math.max(...originalKite.vertices.map(v => v.x)) + spacing,
    y: originalCenter.y
  };
  const copyKite = kiteUtils.getKiteCoords({
    sideA,
    sideB,
    apexAngleDeg,
    centroid: copyCenter
  });

  // Draw original kite in gray
  function drawOriginalKite() {
    ctx.beginPath();
    ctx.moveTo(originalKite.vertices[0].x, originalKite.vertices[0].y);
    for (let v of originalKite.vertices.slice(1)) ctx.lineTo(v.x, v.y);
    ctx.closePath();
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = 'lightgray';
    ctx.fill();
  }
  drawOriginalKite();

  // Draw copy kite in gray
  ctx.beginPath();
  ctx.moveTo(copyKite.vertices[0].x, copyKite.vertices[0].y);
  for (let v of copyKite.vertices.slice(1)) ctx.lineTo(v.x, v.y);
  ctx.closePath();
  ctx.strokeStyle = 'gray';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.fillStyle = 'lightgray';
  ctx.fill();

  // Split copy into triangles
  const triangles = splitKiteModule.splitKiteIntoTriangles({
    kiteVertices: copyKite.vertices
  });
  const triangleColors = ['#0072B2', '#E69F00', '#D55E00', '#009E73'];
  const triangleAnimations = triangles.map((tri, i) =>
    createPolygonAnimation(ctx, tri.vertices, duration, {
      strokeStyle: triangleColors[i],
      lineWidth: 2,
      alpha: 1
    })
  );

  // Rotate + translate helper
  function createRotateTranslateAnimation(
    triangleVertices,
    T2_index,
    T3_index,
    K2_vertex,
    K3_vertex,
    color
  ) {
    const centroid = getTriangleCentroid(triangleVertices);
    const rotateAnim = createRotatePolygonAnimation(
      ctx,
      { points: triangleVertices, centroid },
      0,
      180,
      duration,
      { strokeStyle: color, lineWidth: 1, alpha: 1 }
    );
    const rotatedVertices = rotateAnim.getRotatedPoints(180);
    const V2 = rotatedVertices[T2_index];
    const dxTranslate = K2_vertex.x - V2.x;
    const dyTranslate = K2_vertex.y - V2.y;
    const translatedVertices = rotatedVertices.map(v => ({
      x: v.x + dxTranslate,
      y: v.y + dyTranslate
    }));
    const triVec = {
      x: translatedVertices[T3_index].x - translatedVertices[T2_index].x,
      y: translatedVertices[T3_index].y - translatedVertices[T2_index].y
    };
    const kiteVec = {
      x: K3_vertex.x - K2_vertex.x,
      y: K3_vertex.y - K2_vertex.y
    };
    const deltaAngle =
      Math.atan2(kiteVec.y, kiteVec.x) - Math.atan2(triVec.y, triVec.x);
    const cos = Math.cos(deltaAngle);
    const sin = Math.sin(deltaAngle);
    const finalVertices = translatedVertices.map(v => {
      const dx = v.x - K2_vertex.x;
      const dy = v.y - K2_vertex.y;
      return {
        x: K2_vertex.x + dx * cos - dy * sin,
        y: K2_vertex.y + dx * sin + dy * cos
      };
    });
    const finalCentroid = {
      x:
        (finalVertices[0].x + finalVertices[1].x + finalVertices[2].x) /
        3,
      y:
        (finalVertices[0].y + finalVertices[1].y + finalVertices[2].y) /
        3
    };
    const translateAnim = createTranslatePolygonAnimation(
      ctx,
      { points: rotatedVertices, centroid: getTriangleCentroid(rotatedVertices) },
      getTriangleCentroid(rotatedVertices),
      finalCentroid,
      duration,
      { strokeStyle: color, lineWidth: 1, alpha: 1 }
    );
    return { rotateAnim, translateAnim };
  }

  const triangleMappings = [
    {
      T2: 1,
      T3: 2,
      K2: originalKite.vertices[1],
      K3: originalKite.vertices[0],
      color: triangleColors[0]
    },
    {
      T2: 1,
      T3: 2,
      K2: originalKite.vertices[2],
      K3: originalKite.vertices[1],
      color: triangleColors[1]
    },
    {
      T2: 1,
      T3: 2,
      K2: originalKite.vertices[3],
      K3: originalKite.vertices[2],
      color: triangleColors[2]
    },
    {
      T2: 1,
      T3: 2,
      K2: originalKite.vertices[0],
      K3: originalKite.vertices[3],
      color: triangleColors[3]
    }
  ];

  const extraAnimations = [];
  triangleMappings.forEach((mapping, i) => {
    const { rotateAnim, translateAnim } = createRotateTranslateAnimation(
      triangles[i].vertices,
      mapping.T2,
      mapping.T3,
      mapping.K2,
      mapping.K3,
      mapping.color
    );
    extraAnimations.push(rotateAnim, translateAnim);
  });

  // Diagonal animation (delegates arrow drawing to drawArrow.js)
  function createDiagonalsAnimation(
    diagonals,
    duration,
    lineWidth = 2,
    color = 'red',
    arrowSize = 8
  ) {
    let startTime = null;
    let finished = false;
    return {
      reset: () => {
        startTime = null;
        finished = false;
      },
      update: timestamp => {
        if (!startTime) startTime = timestamp;
        const t = Math.min((timestamp - startTime) / duration, 1);
        if (t >= 1) finished = true;
        return finished;
      },
      draw: timestamp => {
        if (!startTime) startTime = timestamp;
        const t = Math.min((timestamp - startTime) / duration, 1);

        // Draw each diagonal progressively
        diagonals.forEach(d => {
          const x2 = d.from.x + (d.to.x - d.from.x) * t;
          const y2 = d.from.y + (d.to.y - d.from.y) * t;
          drawArrow(ctx, d.from.x, d.from.y, x2, y2, lineWidth, color, arrowSize);
        });
      },
      drawFinal: () => {
        diagonals.forEach(d => {
          drawArrow(ctx, d.from.x, d.from.y, d.to.x, d.to.y, lineWidth, color, arrowSize);
        });
      }
    };
  }

  const diagonalAnimations = [
    createDiagonalsAnimation(
      [
        { from: originalKite.vertices[0], to: originalKite.vertices[2] },
        { from: originalKite.vertices[1], to: originalKite.vertices[3] }
      ],
      duration
    )
  ];

  const removeTrianglesAnimation = {
    reset: () => {},
    update: () => true,
    draw: () => {
      drawOriginalKite(); // Triangles remain visually; diagonals remain if previously drawn
      diagonalAnimations.forEach(anim => anim.drawFinal && anim.drawFinal());
    },
    drawFinal: () => {
      drawOriginalKite();
      diagonalAnimations.forEach(anim => anim.drawFinal && anim.drawFinal());
    }
  };

  const animations = [
    createPolygonAnimation(ctx, originalKite.vertices, duration, {
      strokeStyle: 'gray',
      fillStyle: 'lightgray',
      lineWidth: 1,
      alpha: 1
    }),
    createPolygonAnimation(ctx, copyKite.vertices, duration, {
      strokeStyle: 'gray',
      fillStyle: 'lightgray',
      lineWidth: 1,
      alpha: 1
    }),
    ...triangleAnimations,
    ...extraAnimations,
    ...diagonalAnimations,
    removeTrianglesAnimation
  ];

  const completedMap = [
    [],
    [0],
    [0, 1],
    [0, 1, 2],
    [0, 1, 2, 3],
    [0, 1, 2, 3, 4],
    [0, 3, 4, 5],
    [0, 3, 4, 5],
    [0, 4, 5, 7],
    [0, 4, 5, 7],
    [0, 5, 7, 9],
    [0, 5, 7, 9],
    [0, 7, 9, 11],
    [0, 7, 9, 11],
    [0, 7, 9, 11, 13]
  ];

  controller = createAnimationController(ctx, animations, completedMap);
}

startButton.addEventListener('click', () => {
  initAnimation();
  controller.start();
});
