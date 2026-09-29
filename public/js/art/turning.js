export function smoothFacing(current, target, dt) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-24 * Math.max(0, dt)));
}

export function frontVisibility(angle) {
  const amount = Math.max(0, Math.min(1, (Math.sin(angle) + 0.65) / 0.85));
  return amount * amount * (3 - 2 * amount);
}
