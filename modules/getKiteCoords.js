/**
 * Generate kite coordinates given the apex angle, side lengths, and centroid position.
 * The kite is oriented with the apex pointing up.
 *
 * Returns:
 * - vertices in order: top, right, bottom, left (clockwise)
 * - centroid: the actual centroid of the kite after shifting
 *
 * @param {object} params
 * @param {number} params.sideA       // distance from apex to right/bottom vertex
 * @param {number} params.sideB       // distance from apex to left/bottom vertex
 * @param {number} params.apexAngleDeg // angle at the top vertex in degrees
 * @param {{x:number,y:number}} [params.centroid={x:0,y:0}] // desired centroid position
 * @returns {{ vertices: Array<{x:number,y:number}>, centroid: {x:number,y:number} }}
 */
function getKiteCoords({ sideA, sideB, apexAngleDeg, centroid = { x: 0, y: 0 } }) {
  const apexAngleRad = (apexAngleDeg * Math.PI) / 180;

  // Place apex at origin initially
  const top = { x: 0, y: 0 };

  // Right vertex: along x-axis
  const right = {
    x: sideA * Math.cos(apexAngleRad / 2),
    y: sideA * Math.sin(apexAngleRad / 2)
  };

  // Left vertex: symmetric across vertical axis
  const left = {
    x: -sideA * Math.cos(apexAngleRad / 2),
    y: sideA * Math.sin(apexAngleRad / 2)
  };

  // Bottom vertex: midpoint of left and right, mirrored vertically
  const bottom = {
    x: 0,
    y: Math.max(left.y, right.y) + sideB // extend downward by sideB
  };

  // Compute current centroid
  const currentCentroid = {
    x: (top.x + right.x + bottom.x + left.x) / 4,
    y: (top.y + right.y + bottom.y + left.y) / 4
  };

  // Compute offset to desired centroid
  const dx = centroid.x - currentCentroid.x;
  const dy = centroid.y - currentCentroid.y;

  // Shift all vertices to match the desired centroid
  const vertices = [top, right, bottom, left].map(p => ({
    x: p.x + dx,
    y: p.y + dy
  }));

  // Recalculate actual centroid after shifting
  const actualCentroid = {
    x: (vertices[0].x + vertices[1].x + vertices[2].x + vertices[3].x) / 4,
    y: (vertices[0].y + vertices[1].y + vertices[2].y + vertices[3].y) / 4
  };

  return {
    vertices,
    centroid: actualCentroid
  };
}

export default { getKiteCoords };