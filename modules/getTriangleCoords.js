/**
 * Calculate triangle corner coordinates, centroid, base length, and perpendicular height given:
 * - bottom-left corner coordinate (reference point)
 * - length of base (sideA, to the right)
 * - length of sideB (from bottom-left upwards at the given angle)
 * - angle (in degrees) at bottom-left corner between base and sideB
 *
 * Returns:
 * - vertices in order: bottomLeft, bottomRight, topVertex
 * - centroid coordinate
 * - baseLength (same as sideA)
 * - perpendicularHeight (distance from base to top vertex)
 *
 * @param {object} params
 * @param {number} params.sideA       // base length
 * @param {number} params.sideB       // left side length
 * @param {number} params.angleDeg    // angle at bottom-left corner
 * @param {{x:number,y:number}} [params.bottomLeft={x:0,y:0}]
 * @returns {{ vertices: Array<{x:number,y:number}>, centroid: {x:number,y:number}, baseLength: number, perpendicularHeight: number }}
 */
function getTriangleCoordsFromBottomLeft({
  sideA,
  sideB,
  angleDeg,
  bottomLeft = { x: 0, y: 0 },
}) {
  const { x: x0, y: y0 } = bottomLeft;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Base vector (bottom-left to bottom-right)
  const baseVec = { x: sideA, y: 0 };

  // SideB vector (bottom-left to top vertex)
  const sideBVec = {
    x: sideB * Math.cos(angleRad),
    y: -sideB * Math.sin(angleRad), // negative because canvas y increases downward
  };

  // Calculate vertices
  const bottomRight = { x: x0 + baseVec.x, y: y0 + baseVec.y };
  const topVertex = { x: x0 + sideBVec.x, y: y0 + sideBVec.y };

  // Centroid = average of vertices
  const centroid = {
    x: (x0 + bottomRight.x + topVertex.x) / 3,
    y: (y0 + bottomRight.y + topVertex.y) / 3,
  };

  // Base length
  const baseLength = sideA;

  // Perpendicular height (always positive)
  const perpendicularHeight = Math.abs(sideB * Math.sin(angleRad));

  return {
    vertices: [bottomLeft, bottomRight, topVertex],
    centroid,
    baseLength,
    perpendicularHeight,
  };
}

export default {
  getTriangleCoordsFromBottomLeft,
};

export function getTriangleCentroid(vertices) {
  const [a, b, c] = vertices;
  return {
    x: (a.x + b.x + c.x) / 3,
    y: (a.y + b.y + c.y) / 3,
  };
}