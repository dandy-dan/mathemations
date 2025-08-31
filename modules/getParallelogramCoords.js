/**
 * Calculate parallelogram corner coordinates given:
 * - bottom-left corner coordinate (reference point)
 * - base length (to the right)
 * - vertical height (perpendicular distance between base and top edge)
 * - angle (in degrees) at bottom-left corner between base and height side
 *
 * Returns coordinates in order: bottomLeft, bottomRight, topRight, topLeft (clockwise)
 *
 * @param {object} params
 * @param {number} params.baseLength
 * @param {number} params.verticalHeight  // perpendicular height
 * @param {number} params.angleDeg
 * @param {{x:number,y:number}} [params.bottomLeft={x:0,y:0}]
 * @returns {Array<{x:number,y:number}>}
 */
function getParallelogramCoordsFromBottomLeft({
  baseLength,
  verticalHeight,
  angleDeg,
  bottomLeft = { x: 0, y: 0 },
}) {
  const { x: x0, y: y0 } = bottomLeft;
  const angleRad = (angleDeg * Math.PI) / 180;

  // Calculate length of side along the angle from bottom-left corner
  const heightSideLength = verticalHeight / Math.sin(angleRad);

  // Base vector: along +x direction
  const baseVec = { x: baseLength, y: 0 };

  // Height vector: points upward and left/right at the specified angle
  // Since angle is at bottom-left corner between base and height side,
  // heightVec points "upwards" at angleDeg from base
  const heightVec = {
    x: heightSideLength * Math.cos(angleRad),
    y: -heightSideLength * Math.sin(angleRad), // negative because canvas y increases downward
  };

  // Calculate corners
  const bottomRight = { x: x0 + baseVec.x, y: y0 + baseVec.y };
  const topLeft = { x: x0 + heightVec.x, y: y0 + heightVec.y };
  const topRight = { x: bottomRight.x + heightVec.x, y: bottomRight.y + heightVec.y };

  return [bottomLeft, bottomRight, topRight, topLeft];
}

export default {
  getParallelogramCoordsFromBottomLeft,
};