import test from 'node:test';
import assert from 'node:assert/strict';
import { stepGrass } from '../public/js/art/grass-motion.js';

test('grass bends away from a nearby player and settles after they leave', () => {
  const stem = { x: 100, y: 100, bendX: 0, bendY: 0, vx: 0, vy: 0 };
  for (let i = 0; i < 30; i++) stepGrass(stem, [{ x: 80, y: 100, alive: true }], 1 / 60);
  assert.ok(stem.bendX > 10);
  for (let i = 0; i < 180; i++) stepGrass(stem, [], 1 / 60);
  assert.ok(Math.abs(stem.bendX) < 0.01);
  assert.ok(Math.abs(stem.vx) < 0.01);
});
