//Fix blurry images on canvas and dynamically rescale canvas when resized.
export default function setupResizeListener(canvas, context, draw) {
  let resizeTimeout;
  resizeCanvasToDisplaySize(canvas, context);
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (resizeCanvasToDisplaySize(canvas, context)) {
        draw();
      }
    }, 100);
  });
}

function resizeCanvasToDisplaySize(canvas, context) {
const dpr = window.devicePixelRatio || 1; //number of physical pixels per CSS pixel
const rect = canvas.getBoundingClientRect(); //the CSS drawing size
  if (canvas._lastDpr === undefined) canvas._lastDpr = 0; //initialises lastDPR
  const targetWidth = Math.round(rect.width * dpr);
  const targetHeight = Math.round(rect.height * dpr);
  const sizeChanged = canvas.width !== targetWidth || canvas.height !== targetHeight;
  const dprChanged = canvas._lastDpr !== dpr;
  if (sizeChanged || dprChanged) {
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas._lastDpr = dpr;
    return true;
  }
  return false;
}








