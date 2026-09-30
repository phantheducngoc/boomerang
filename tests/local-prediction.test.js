import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer } from '../shared/game.js';
import { LocalPrediction, predictMovement } from '../public/js/local-prediction.js';

function fixture(x = 180, y = 170) {
  const player = createPlayer('local', 'Local', 'mint');
  Object.assign(player, { x, y });
  const state = { phase: 'playing', players: [player], brokenObstacles: [] };
  return { player, state };
}

const right = { x: 1, y: 0, aim: 0, throw: false, dash: false, strike: false, charging: false };

test('local input moves immediately and acknowledged input is reconciled', () => {
  const { player, state } = fixture();
  const prediction = new LocalPrediction();
  prediction.reset(player);
  prediction.record(1, right, state, 'local');
  const immediate = prediction.apply(state, state, 'local').players[0];
  assert.ok(immediate.x > player.x);

  prediction.reconcile({ ...player, inputSequence: 0 }, state);
  assert.ok(prediction.player.x > player.x, 'unacknowledged movement is replayed');
  prediction.reconcile({ ...player, x: 187, inputSequence: 1 }, state);
  assert.equal(prediction.player.x, 187);
  assert.equal(prediction.history.length, 0);
});

test('prediction uses authoritative obstacle collision', () => {
  const { player, state } = fixture(245, 220);
  const predicted = { ...player };
  predictMovement(predicted, right, 1 / 30, state);
  assert.equal(predicted.x, 245);
});

test('neutral input stops predicted movement before server acknowledgement', () => {
  const { player, state } = fixture();
  const prediction = new LocalPrediction();
  prediction.reset(player);
  prediction.record(1, right, state, 'local');
  const releasedAt = prediction.player.x;
  prediction.record(2, { ...right, x: 0 }, state, 'local');
  prediction.record(3, { ...right, x: 0 }, state, 'local');
  assert.equal(prediction.player.x, releasedAt);
});

test('dash prediction starts immediately without changing authoritative state', () => {
  const { player, state } = fixture();
  const predicted = { ...player };
  predictMovement(predicted, { ...right, dash: true }, 1 / 30, state);
  assert.ok(predicted.x - player.x > 20);
  assert.equal(player.x, 180);
});
