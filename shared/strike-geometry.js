import { RULES } from './config.js';
import { collides, distance } from './physics.js';

export function strikeReach(player, angle, limit = RULES.strikeRange, broken = []) {
  for (let step = 1; step <= Math.ceil(limit); step++) {
    const length = Math.min(step, limit);
    if (collides(player.x + Math.cos(angle) * length,
      player.y + Math.sin(angle) * length, 1, broken)) return Math.max(0, length - 1);
  }
  return limit;
}

export function inStrikeArc(player, target, aim = player.strikeAim, radius = 0, broken = []) {
  const length = distance(player, target);
  if (length > RULES.strikeRange + radius) return false;
  const direction = Math.atan2(target.y - player.y, target.x - player.x);
  const difference = Math.atan2(Math.sin(direction - aim), Math.cos(direction - aim));
  if (radius === 0) {
    if (Math.abs(difference) > RULES.strikeHalfAngle) return false;
    return length <= strikeReach(player, direction, length, broken);
  }
  const spread = Math.asin(Math.min(1, radius / (length || 1)));
  const start = Math.max(-RULES.strikeHalfAngle, difference - spread);
  const end = Math.min(RULES.strikeHalfAngle, difference + spread);
  if (start > end) return false;
  const steps = Math.max(1, Math.ceil((end - start) / 0.025));
  const angles = [Math.max(start, Math.min(end, difference))];
  for (let i = 0; i <= steps; i++) angles.push(start + (end - start) * i / steps);
  for (const angle of angles) {
    const delta = difference - angle;
    const perpendicular = length * Math.sin(delta);
    const along = length * Math.cos(delta);
    if (along < 0 || Math.abs(perpendicular) > radius) continue;
    const entry = Math.max(0, along - Math.sqrt(Math.max(0, radius * radius - perpendicular * perpendicular)));
    if (entry <= RULES.strikeRange
      && entry <= strikeReach(player, aim + angle, entry, broken)) return true;
  }
  return false;
}
