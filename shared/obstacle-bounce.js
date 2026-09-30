import { activeObstacles, clamp } from './physics.js';

export function bounceOffObstacle(weapon, previous, broken = []) {
  const box = activeObstacles(broken).find(item => Math.hypot(
    weapon.x - clamp(weapon.x, item.x, item.x + item.w),
    weapon.y - clamp(weapon.y, item.y, item.y + item.h)) < 8);
  if (!box) return;
  let nx = previous.x - clamp(previous.x, box.x, box.x + box.w);
  let ny = previous.y - clamp(previous.y, box.y, box.y + box.h);
  const length = Math.hypot(nx, ny);
  if (length) { nx /= length; ny /= length; }
  else { nx = -Math.cos(weapon.angle); ny = -Math.sin(weapon.angle); }
  const vx = Math.cos(weapon.angle), vy = Math.sin(weapon.angle);
  const dot = vx * nx + vy * ny;
  // Reflect against the surface normal, retaining some sideways momentum.
  const rx = vx - 2 * dot * nx, ry = vy - 2 * dot * ny;
  Object.assign(weapon, {
    x: clamp(previous.x, box.x, box.x + box.w) + nx * 21,
    y: clamp(previous.y, box.y, box.y + box.h) + ny * 21,
    angle: Math.atan2(ry, rx), speed: Math.min(260, Math.max(110, weapon.speed * 0.4)),
    mode: 'deflected', returning: false, recalling: false, sharedPickup: false,
    fallTime: 0, obstacleDrop: true
  });
  weapon.safeX = weapon.x;
  weapon.safeY = weapon.y;
}

export function droppedHeight(weapon) {
  const time = weapon.fallTime ?? 0;
  return weapon.obstacleDrop
    ? Math.max(0, 12 + 55 * time - 240 * time * time)
    : Math.max(0, 14 * (1 - time / 0.4));
}
