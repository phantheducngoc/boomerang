import { activeObstacles, clamp, collides } from './physics.js';

export function recallStep(weapon, owner, travel, broken = []) {
  if (weapon.slideTarget) {
    const goal = weapon.slideTarget;
    const dx = goal.x - weapon.x, dy = goal.y - weapon.y;
    const length = Math.hypot(dx, dy);
    if (length < 0.1) weapon.slideTarget = null;
    else {
      const step = Math.min(travel * goal.strength, length);
      const next = { x: weapon.x + dx / length * step, y: weapon.y + dy / length * step };
      if (!collides(next.x, next.y, 20, broken)) return next;
      weapon.slideTarget = null;
    }
  }
  const dx = owner.x - weapon.x, dy = owner.y - weapon.y;
  const length = Math.hypot(dx, dy) || 1;
  const next = { x: weapon.x + dx / length * travel, y: weapon.y + dy / length * travel };
  if (!collides(next.x, next.y, 20, broken)) return next;
  const box = activeObstacles(broken).find(item => Math.hypot(next.x - clamp(next.x, item.x, item.x + item.w),
    next.y - clamp(next.y, item.y, item.y + item.h)) < 20);
  if (!box) return null;
  const nx = weapon.x - clamp(weapon.x, box.x, box.x + box.w);
  const ny = weapon.y - clamp(weapon.y, box.y, box.y + box.h);
  const vertical = Math.abs(nx) >= Math.abs(ny);
  const tangent = vertical ? dy : dx;
  const strength = Math.abs(tangent) / length;
  if (strength < 1e-6) return null;
  const goal = vertical
    ? { x: weapon.x, y: tangent < 0 ? box.y - 21 : box.y + box.h + 21 }
    : { x: tangent < 0 ? box.x - 21 : box.x + box.w + 21, y: weapon.y };
  // Once a deliberate angled pull starts, keep sliding to the corner rather
  // than stalling when the weapon lines up with its owner along the wall.
  if (strength >= Math.sin(20 * Math.PI / 180)) weapon.slideTarget = { ...goal, strength };
  const step = Math.min(travel * strength, Math.abs(vertical ? goal.y - weapon.y : goal.x - weapon.x));
  const slide = vertical ? { x: weapon.x, y: weapon.y + Math.sign(tangent) * step }
    : { x: weapon.x + Math.sign(tangent) * step, y: weapon.y };
  return collides(slide.x, slide.y, 20, broken) ? null : slide;
}
