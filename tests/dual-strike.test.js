import test from 'node:test';
import assert from 'node:assert/strict';
import { RULES } from '../shared/config.js';
import { createPlayer } from '../shared/game.js';
import { strike, updateStrikeCombo } from '../shared/melee.js';

function setup(weapons = 2) {
  const player = createPlayer('one', 'One', 'mint');
  player.weaponCount = weapons;
  const state = { players: [player], projectiles: [], brokenObstacles: [], events: [], sequence: 0 };
  return { state, player };
}

test('two held boomerangs allow a right-left strike combo', () => {
  const { state, player } = setup();

  strike(state, player, true);
  assert.equal(player.strikeHand, 'right');
  assert.equal(player.strikeComboAvailable, true);

  strike(state, player, true);
  assert.equal(player.strikeComboQueued, true, 'the follow-up is buffered during the first swing');

  player.strikeTime = 0;
  updateStrikeCombo(state, player, 0.01);
  assert.equal(player.strikeHand, 'left');
  assert.equal(player.strikeTime, RULES.strikeTime);
  assert.equal(player.strikeComboAvailable, false);

  const secondStrikeTime = player.strikeTime;
  strike(state, player, true);
  assert.equal(player.strikeTime, secondStrikeTime, 'a third strike remains on cooldown');
  assert.equal(player.strikeComboQueued, false);
});

test('one press only swings once even while holding two boomerangs', () => {
  const { state, player } = setup();
  strike(state, player, true);

  player.strikeTime = 0;
  updateStrikeCombo(state, player, RULES.strikeTime);

  assert.equal(player.strikeTime, 0);
  assert.equal(player.strikeHand, 'right');
  assert.equal(player.strikeComboQueued, false);
});

test('one held boomerang cannot start the second swing', () => {
  const { state, player } = setup();
  strike(state, player, true);
  state.projectiles.push({ owner: player.id });

  strike(state, player, true);
  assert.equal(player.strikeComboQueued, false);
  assert.equal(player.strikeHand, 'right');
});

test('a player with one boomerang keeps the normal strike cooldown', () => {
  const { state, player } = setup(1);
  strike(state, player, true);
  player.strikeTime = 0;

  strike(state, player, true);
  assert.equal(player.strikeTime, 0);
  assert.equal(player.strikeComboAvailable, false);
});
