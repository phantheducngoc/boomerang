// Frame the enlarged island closely; offshore throws can still pull the camera out.
export const CAMERA = { scaleX: 0.96, scaleY: 0.84, offsetX: 30, offsetY: 75 };
export const WATER_BLEED = 420;

export function applyCamera(ctx, view = { zoom: 1 }) {
  ctx.translate(750, 495);
  ctx.scale(view.zoom, view.zoom);
  ctx.translate(-750, -495);
  ctx.transform(CAMERA.scaleX, 0, 0, CAMERA.scaleY, CAMERA.offsetX, CAMERA.offsetY);
}

export function screenToWorld(x, y, view = { zoom: 1 }) {
  x = 750 + (x - 750) / view.zoom;
  y = 495 + (y - 495) / view.zoom;
  return {
    x: (x - CAMERA.offsetX) / CAMERA.scaleX,
    y: (y - CAMERA.offsetY) / CAMERA.scaleY
  };
}

export function worldToScreen(x, y, view = { zoom: 1 }) {
  return {
    x: 750 + (x * CAMERA.scaleX + CAMERA.offsetX - 750) * view.zoom,
    y: 495 + (y * CAMERA.scaleY + CAMERA.offsetY - 495) * view.zoom
  };
}

export function updateCamera(view, projectiles, dt) {
  let target = 1;
  for (const weapon of projectiles) {
    const point = worldToScreen(weapon.x, weapon.y);
    // Leave room for the spinning sprite and the next network update.
    target = Math.min(target, 680 / (Math.abs(point.x - 750) + 80),
      425 / (Math.abs(point.y - 495) + 80));
  }
  // Keep the arena prominent even when a long throw travels beyond the view.
  target = Math.max(0.9, target);
  const rate = target < view.zoom ? 6 : 3;
  view.zoom += (target - view.zoom) * (1 - Math.exp(-rate * Math.max(0, dt)));
}

export function keepSpriteUpright(ctx) {
  ctx.scale(1 / CAMERA.scaleX, 1 / CAMERA.scaleY);
}
