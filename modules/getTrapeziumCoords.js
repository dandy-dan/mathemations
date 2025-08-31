/**
 * Calculate trapezium corner coordinates given:
 * - bottom-left corner coordinate (reference point)
 * - length of bottom parallel side (sideA)
 * - length of top parallel side (sideB)
 * - perpendicular height
 * - bottom-left angle in degrees
 *
 * Returns an object with:
 * - points: array of corners in order [bottomLeft, bottomRight, topRight, topLeft]
 * - centroid: {x, y} of the trapezium
 *
 * @param {object} params
 * @param {number} params.sideA  // bottom parallel side length
 * @param {number} params.sideB  // top parallel side length
 * @param {number} params.verticalHeight  // perpendicular height
 * @param {number} params.angleDeg  // bottom-left angle in degrees
 * @param {{x:number,y:number}} [params.bottomLeft={x:0,y:0}]
 * @returns {{ points: Array<{x:number,y:number}>, centroid: {x:number,y:number} }}
 */
function getTrapeziumCoordsFromBottomLeft({
  sideA,
  sideB,
  verticalHeight,
  angleDeg,
  bottomLeft = { x: 0, y: 0 },
}) {
  const { x: x0, y: y0 } = bottomLeft;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Calculate the top-left corner
  const topLeftX = x0 + verticalHeight / Math.tan(angleRad);
  const topLeftY = y0 - verticalHeight;

  // Top-right corner
  const topRight = { x: topLeftX + sideB, y: topLeftY };

  // Bottom-right corner
  const bottomRight = { x: x0 + sideA, y: y0 };

  const points = [bottomLeft, bottomRight, topRight, { x: topLeftX, y: topLeftY }];

  // Compute centroid using simple average of vertices
  const centroid = points.reduce(
    (acc, p) => ({ x: acc.x + p.x / points.length, y: acc.y + p.y / points.length }),
    { x: 0, y: 0 }
  );

  return { points, centroid };
}

export default {
  getTrapeziumCoordsFromBottomLeft,
};