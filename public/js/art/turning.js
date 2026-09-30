export function smoothFacing(current, target, dt) {
  const delta = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + delta * (1 - Math.exp(-24 * Math.max(0, dt)));
}

export function frontVisibility(angle) {
  const amount = Math.max(0, Math.min(1, Math.sin(angle) / 0.55));
  return amount * amount * (3 - 2 * amount);
}

export function bodyProjection(angle, thickness = 24) {
  return {
    width: Math.abs(Math.sin(angle)),
    depth: Math.cos(angle) * thickness,
    back: Math.sin(angle) < 0,
    faceX: Math.cos(angle) * thickness / 2
  };
}
