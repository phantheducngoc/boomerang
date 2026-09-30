import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';

test('a running slash pauses briefly after its swing then resumes held movement', () => {
  const player = createPlayer('a', 'A', 'mint');
  const state = createGame([player, createPlayer('b', 'B', 'rose')]);
  Object.assign(state, { phase: 'playing', remaining: 50 });
  Object.assign(player, { x: 700, y: 600 });
  Object.assign(player.input, { x: 1, strike: true });
  for (let i = 0; i < 15; i++) stepGame(state, 1 / 60);
  assert.equal(player.strikeTime, 0);
  assert.ok(player.strikeRecoveryTime > 0);
  const settledX = player.x;
  stepGame(state, 1 / 60);
  assert.equal(player.x, settledX);
  for (let i = 0; i < 12; i++) stepGame(state, 1 / 60);
  assert.ok(player.x > settledX);
});
