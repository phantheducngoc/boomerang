import { OBSTACLES, WORLD } from './config.js';
import { offIsland } from './islands.js';

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

export function outsideArena(x, y, radius = WORLD.radius) {
  return x < 55 + radius || x > WORLD.width - 55 - radius ||
    y < 55 + radius || y > WORLD.height - 55 - radius;
}

export function activeObstacles(broken = []) {
  return OBSTACLES.filter((_, index) => !broken.includes(index));
}

export function collides(x, y, radius = WORLD.radius, broken = []) {
  if (outsideArena(x, y, radius)) return true;
  return hitsObstacle(x, y, radius, broken);
}

export function hitsObstacle(x, y, radius = WORLD.radius, broken = []) {
  return activeObstacles(broken).some(box => {
    const dx = x - clamp(x, box.x, box.x + box.w);
    const dy = y - clamp(y, box.y, box.y + box.h);
    return dx * dx + dy * dy < radius * radius;
  });
}

function blockedByPlayer(player, x, y, players, onContact) {
  return players.some(other => {
    if (other.id === player.id || !other.alive) return false;
    const next = Math.hypot(x - other.x, y - other.y);
    const current = distance(player, other);
    // Allow separation if a restored state already contains overlapping players.
    const blocked = next < WORLD.radius * 2 && next <= current;
    if (blocked) onContact?.(player, other);
    return blocked;
  });
}

export function terrainBlocked(x, y, radius = WORLD.radius, broken = []) {
  return collides(x, y, radius, broken) || offIsland(x, y, radius);
}

export function movePlayer(player, vx, vy, dt, players = [], onContact, broken = []) {
  // Small steps prevent a dash from tunneling through thin cover.
  const steps = Math.max(1, Math.ceil(Math.hypot(vx, vy) * dt / 8));
  for (let step = 0; step < steps; step++) {
    const x = player.x + vx * dt / steps;
    const y = player.y + vy * dt / steps;
    if (!collides(x, player.y, WORLD.radius, broken) && !blockedByPlayer(player, x, player.y, players, onContact)) player.x = x;
    if (!collides(player.x, y, WORLD.radius, broken) && !blockedByPlayer(player, player.x, y, players, onContact)) player.y = y;
  }
}

export function segmentDistance(point, from, to) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const t = clamp(((point.x - from.x) * dx + (point.y - from.y) * dy) /
    (dx * dx + dy * dy || 1), 0, 1);
  return Math.hypot(point.x - from.x - t * dx, point.y - from.y - t * dy);
}
