// A damped spring lets disturbed stems settle naturally after a player passes.
export function stepGrass(stem, players, dt) {
  let targetX = 0, targetY = 0;
  for (const player of players) {
    if (!player.alive || player.fallElapsed != null) continue;
    const dx = stem.x - player.x, dy = stem.y - player.y;
    const distance = Math.hypot(dx, dy);
    if (distance >= 55) continue;
    const strength = (1 - distance / 55) * 22;
    const direction = distance || 1;
    targetX += (distance ? dx / direction : 1) * strength;
    targetY += dy / direction * strength * 0.6;
  }
  const length = Math.hypot(targetX, targetY);
  if (length > 28) { targetX *= 28 / length; targetY *= 28 / length; }
  const steps = Math.max(1, Math.ceil(Math.min(dt, 0.1) * 120));
  const step = Math.max(0, Math.min(dt, 0.1)) / steps;
  for (let i = 0; i < steps; i++) {
    stem.vx += ((targetX - stem.bendX) * 100 - stem.vx * 13) * step;
    stem.vy += ((targetY - stem.bendY) * 100 - stem.vy * 13) * step;
    stem.bendX += stem.vx * step;
    stem.bendY += stem.vy * step;
  }
}
