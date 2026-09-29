export function throwAngle(aim) {
  return aim;
}

export function returnAngle(weapon, owner) {
  const desired = Math.atan2(owner.y - weapon.y, owner.x - weapon.x);
  if (!weapon.loopReturn) return desired;
  const remaining = Math.hypot(owner.x - weapon.x, owner.y - weapon.y);
  const fraction = Math.min(1, remaining / Math.max(1, weapon.range));
  return desired + 0.12 * Math.sin(Math.PI * fraction);
}
