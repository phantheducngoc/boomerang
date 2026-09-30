import test from 'node:test';
import assert from 'node:assert/strict';
import { bounceOffObstacle, droppedHeight } from '../shared/obstacle-bounce.js';
import { updateDropped } from '../shared/parry.js';
import { collides } from '../shared/physics.js';

test('obstacle impact reflects, rises briefly and settles away from cover', () => {
  const weapon = { x: 263, y: 225, angle: 0, speed: 600, owner: 'a' };
  bounceOffObstacle(weapon, { x: 260, y: 225 });
  const start = weapon.x;
  const initialHeight = droppedHeight(weapon);
  updateDropped(weapon, 0.05);
  assert.ok(weapon.x < start);
  assert.ok(droppedHeight(weapon) > initialHeight);
  for (let i = 0; i < 100; i++) updateDropped(weapon, 1 / 180);
  assert.equal(weapon.mode, 'grounded');
  assert.equal(droppedHeight(weapon), 0);
  assert.equal(collides(weapon.x, weapon.y, 20), false);
  assert.equal(weapon.owner, 'a');
  assert.equal(weapon.sharedPickup, false);
});
