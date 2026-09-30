import test from 'node:test';
import assert from 'node:assert/strict';
import { HOLES } from '../shared/holes.js';
import { offIsland, outwardDirection } from '../shared/islands.js';
import { createGame, createPlayer } from '../shared/game.js';
import { resolveFalls } from '../shared/falls.js';
import { SPAWNS } from '../shared/config.js';

test('both interior holes trigger a delayed fall and drift toward the pit', () => {
  for (const hole of HOLES) {
    const player = createPlayer('a', 'A', 'mint');
    const state = createGame([player]);
    Object.assign(player, { x: hole.x - hole.radius + 2, y: hole.y });
    assert.equal(offIsland(player.x, player.y), true);
    assert.ok(outwardDirection(player.x, player.y).x > 0);
    resolveFalls(state, 0.01);
    assert.equal(player.alive, true);
    resolveFalls(state, 0.7);
    assert.equal(player.fallen, true);
    assert.equal(player.alive, false);
  }
  for (const [x, y] of SPAWNS) assert.equal(offIsland(x, y, 20), false);
});
