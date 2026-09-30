import test from 'node:test';
import assert from 'node:assert/strict';
import { SnapshotBuffer, interpolateState } from '../public/js/snapshot-buffer.js';

function state(x, angle = 0) {
  return {
    phase: 'playing',
    players: [{ id: 'a', x, y: x / 2, facing: angle, aim: angle }],
    projectiles: [{ id: 1, x: x * 2, y: x, angle, mode: 'flying' }]
  };
}

test('snapshots interpolate players and boomerangs by id', () => {
  const halfway = interpolateState(state(0), state(100), 0.5);
  assert.equal(halfway.players[0].x, 50);
  assert.equal(halfway.players[0].y, 25);
  assert.equal(halfway.players[0].clientInterpolated, true);
  assert.equal(halfway.projectiles[0].x, 100);
});

test('angles interpolate over the short side of the turn boundary', () => {
  const from = state(0, Math.PI - 0.1);
  const to = state(0, -Math.PI + 0.1);
  const halfway = interpolateState(from, to, 0.5);
  assert.ok(Math.abs(Math.abs(halfway.players[0].facing) - Math.PI) < 0.001);
});

test('the buffer renders behind the newest snapshot to absorb jitter', () => {
  const buffer = new SnapshotBuffer();
  buffer.push(state(0), 100);
  buffer.push(state(100), 200);
  assert.equal(buffer.sample(250, 100).players[0].x, 50);
  assert.equal(buffer.sample(400, 100).players[0].x, 100);
});
