export const CAMERA = { scaleX: 0.92, scaleY: 0.78, offsetX: 60, offsetY: 105 };

export function applyCamera(ctx) {
  ctx.transform(CAMERA.scaleX, 0, 0, CAMERA.scaleY, CAMERA.offsetX, CAMERA.offsetY);
}

export function screenToWorld(x, y) {
  return {
    x: (x - CAMERA.offsetX) / CAMERA.scaleX,
    y: (y - CAMERA.offsetY) / CAMERA.scaleY
  };
}

export function worldToScreen(x, y) {
  return {
    x: x * CAMERA.scaleX + CAMERA.offsetX,
    y: y * CAMERA.scaleY + CAMERA.offsetY
  };
}

export function keepSpriteUpright(ctx) {
  ctx.scale(1 / CAMERA.scaleX, 1 / CAMERA.scaleY);
}
