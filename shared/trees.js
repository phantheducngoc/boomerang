// Drawing and collision share the same trunk positions and scale.
export const TREES = [
  { x: 180, y: 240, scale: 1.2 },
  { x: 1000, y: 160, scale: 1.05 }
];

export const TREE_OBSTACLES = TREES.map(({ x, y, scale }) => ({
  kind: 'tree',
  x: x - 12 * scale,
  y: y - 8 * scale,
  w: 27 * scale,
  h: 25 * scale
}));
