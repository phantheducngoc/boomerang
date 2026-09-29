import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { strike } from '../shared/melee.js';
import { updateStrikeMotion } from '../shared/strike-motion.js';

function strikeTravel(speed) {
  const player = createPlayer('one', 'One', 'mint');
  Object.assign(player, { x: 700, y: 600, motionX: speed, motionY: 0 });
  const state = { players: [player], projectiles: [], brokenObstacles: [], events: [], sequence: 0 };
  strike(state, player, true);
  updateStrikeMotion(state, 0.09);
  return player.x - 700;
}

test('strike momentum depends on actual movement speed', () => {
  const standing = strikeTravel(0);
  const walking = strikeTravel(210);
  const dashing = strikeTravel(660);

  assert.equal(standing, 0, 'standing strikes stay in place');
  assert.ok(walking > 40 && walking < 50,
    'walking produces a distinct forward burst');
  assert.ok(dashing > 80, 'dash momentum carries the strike farther');
  assert.ok(dashing > walking * 1.5, 'faster movement carries the strike farther');
});

test('running forward and striking adds 45 pixels of real travel during the swing', () => {
  function run(attacking, direction = 1) {
    const player = createPlayer('one', 'One', 'mint');
    const other = createPlayer('two', 'Two', 'rose');
    const state = createGame([player, other]);
    Object.assign(state, { phase: 'playing', remaining: 50 });
    Object.assign(player, { x: 700, y: 600 });
    Object.assign(player.input, { x: direction, aim: 0, strike: attacking });
    for (let i = 0; i < 12; i++) stepGame(state, 1 / 60);
    return player.x;
  }
  assert.ok(Math.abs(run(true) - run(false) - 45) < 0.01);
  assert.equal(run(true, 0), run(false, 0), 'standing attacks stay planted');
  assert.equal(run(true, -1), run(false, -1), 'backward running does not lunge forward');
});
