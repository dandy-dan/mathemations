/**
 * Split a kite into 4 right-angled triangles.
 * The kite vertices should be in order: top, right, bottom, left (clockwise).
 *
 * Returns:
 * - An array of 4 triangles, each with vertices in order: right-angle vertex, other vertex1, other vertex2
 *
 * @param {object} params
 * @param {Array<{x:number,y:number}>} params.kiteVertices - top, right, bottom, left
 * @returns {Array<{ vertices: Array<{x:number,y:number}> }>}
 */
function splitKiteIntoTriangles({ kiteVertices }) {
  const [top, right, bottom, left] = kiteVertices;

  // Compute intersection of diagonals
  const center = {
    x: (top.x + bottom.x) / 2,
    y: (left.y + right.y) / 2
  };

  // Each triangle: right angle at the center (intersection of diagonals)
  return [
    { vertices: [center, top, right] },    // top-right
    { vertices: [center, right, bottom] }, // bottom-right
    { vertices: [center, bottom, left] },  // bottom-left
    { vertices: [center, left, top] }      // top-left
  ];
}

export default {
  splitKiteIntoTriangles,
};