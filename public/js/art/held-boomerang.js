import { boomerang, BOOMERANG_SCALE } from './shapes.js';

// The hold is seen from above. Turning rotates the boomerang in the hand;
// it never collapses into an edge-on line.
export function heldBoomerangView(facing) {
  return {
    face: 1,
    edge: 0,
    breadth: 1,
    away: Math.max(0, -Math.sin(facing))
  };
}

export function drawHeldBoomerang(ctx, x, y, facing, scale = BOOMERANG_SCALE, color = '#f8d47d') {
  const view = heldBoomerangView(facing);
  boomerang(ctx, x, y, facing + Math.PI / 2, scale, color, view.breadth);
}
