const SHORE_OUTLINE = [
  [80, 70], [500, 60], [610, 60], [900, 70], [1400, 100],
  [1440, 280], [1340, 385], [1435, 500], [1380, 900],
  [930, 925], [790, 880], [650, 945], [120, 860],
  [60, 610], [150, 480], [55, 330]
];

// Keep the full island outline instead of pulling the southern and eastern coasts inward.
export const SHORE = SHORE_OUTLINE.map(([x, y]) =>
  [750 + (x - 750) * 0.94, 500 + (y - 500) * 0.94]);

function insidePolygon(x, y) {
  let inside = false;
  for (let i = 0, j = SHORE.length - 1; i < SHORE.length; j = i++) {
    const [xi, yi] = SHORE[i];
    const [xj, yj] = SHORE[j];
    if ((yi > y) !== (yj > y) &&
      x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function segmentDistance(x, y, a, b) {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) /
    (dx * dx + dy * dy || 1)));
  return Math.hypot(x - a[0] - t * dx, y - a[1] - t * dy);
}

export function offIsland(x, y, radius = 0) {
  if (!insidePolygon(x, y)) return true;
  if (radius <= 0) return false;
  return SHORE.some((point, index) =>
    segmentDistance(x, y, point, SHORE[(index + 1) % SHORE.length]) < radius);
}

export function outwardDirection(x, y) {
  let closest = null;
  let best = Infinity;
  for (let i = 0; i < SHORE.length; i++) {
    const a = SHORE[i], b = SHORE[(i + 1) % SHORE.length];
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / (dx * dx + dy * dy)));
    const offsetX = x - a[0] - t * dx, offsetY = y - a[1] - t * dy;
    const length = Math.hypot(offsetX, offsetY);
    if (length < best) {
      best = length;
      closest = length > 1e-6 ? { x: offsetX / length, y: offsetY / length }
        : { x: dy / Math.hypot(dx, dy), y: -dx / Math.hypot(dx, dy) };
    }
  }
  return closest;
}
