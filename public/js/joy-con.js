export function joyConSide(id = '') {
  const name = String(id);
  if (/joy-?con[^a-z0-9]*r\b/i.test(name) || /057e/i.test(name) && /2007/.test(name)) return 'right';
  if (/joy-?con[^a-z0-9]*l\b/i.test(name) || /057e/i.test(name) && /2006/.test(name)) return 'left';
  return null;
}

// macOS exposes a sideways Joy-Con with its vertical stick axes.
export function joyConMove(axes = [], side) {
  const x = Number.isFinite(axes[0]) ? axes[0] : 0;
  const y = Number.isFinite(axes[1]) ? axes[1] : 0;
  return side === 'left' ? [y, -x] : [-y, x];
}

export function joyConButtons(side) {
  return side === 'left'
    ? { throw: 2, dash: [0, 4], strike: [1, 3, 5] }
    : { throw: 0, dash: [3, 4], strike: [1, 2, 5] };
}
