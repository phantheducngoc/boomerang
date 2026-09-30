import test from 'node:test';
import assert from 'node:assert/strict';
import { heldBoomerangView } from '../public/js/art/held-boomerang.js';

test('a top-down hold stays a boomerang at 9 and 90 degrees', () => {
  for (const facing of [0, Math.PI / 20, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const view = heldBoomerangView(facing);
    assert.equal(view.face, 1);
    assert.equal(view.edge, 0);
    assert.equal(view.breadth, 1);
  }
});

test('facing away is still the overhead boomerang', () => {
  const back = heldBoomerangView(-Math.PI / 2);
  assert.equal(back.face, 1);
  assert.equal(back.away, 1);
  assert.equal(heldBoomerangView(Math.PI / 2).away, 0);
});
