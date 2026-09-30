// Shared by terrain rules and drawing so the visible rim matches the fall boundary.
export const HOLES = [
  { x: 450, y: 475, radius: 85 },
  { x: 1110, y: 580, radius: 90 }
];

export function holeRadius(hole, angle) {
  return hole.radius * (1 + 0.035 * Math.sin(angle * 3) + 0.025 * Math.sin(angle * 7));
}

export function holeAt(x, y, clearance = 0) {
  return HOLES.find(hole => Math.hypot(x - hole.x, y - hole.y)
    < holeRadius(hole, Math.atan2(y - hole.y, x - hole.x)) + clearance);
}
