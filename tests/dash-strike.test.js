import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { RULES } from '../shared/config.js';

function setup() {
  const state = createGame([createPlayer('a', 'A', 'mint'), createPlayer('b', 'B', 'peach')]);
  state.phase = 'playing';
  state.remaining = 55;
  Object.assign(state.players[0], { x: 500, y: 120 });
  Object.assign(state.players[1], { x: 850, y: 120 });
  return state;
}

test('dash and strike together move toward aim and hit immediately', () => {
  const state = setup();
  const [player, target] = state.players;
  target.x = player.x + RULES.strikeRange + 10;
  Object.assign(player.input, { x: -1, aim: 0, dash: true, strike: true });
  stepGame(state, 1 / 30);
  assert.ok(player.x > 500);
  assert.equal(player.dashX, 1);
  assert.equal(player.strikeAim, 0);
  assert.ok(player.dashTime > 0);
  assert.equal(player.strikeTime, RULES.strikeTime);
  assert.equal(target.alive, false);
});

test('controller pickup does not suppress a dash strike', () => {
  const state = setup();
  const player = state.players[0];
  state.projectiles.push({ id: 1, owner: player.id, mode: 'grounded', x: 522, y: 120 });
  Object.assign(player.input, { aim: 0, dash: true, strike: true, retrieve: true });
  stepGame(state, 1 / 30);
  assert.equal(state.projectiles.length, 0);
  assert.equal(player.strikeTime, RULES.strikeTime);
});

test('strike can start during an existing dash without restarting the dash', () => {
  const state = setup();
  const player = state.players[0];
  Object.assign(player.input, { aim: 0, dash: true });
  stepGame(state, 1 / 30);
  const remaining = player.dashTime;
  player.input.strike = true;
  stepGame(state, 1 / 30);
  assert.ok(player.dashTime < remaining);
  assert.equal(player.strikeTime, RULES.strikeTime);
});

test('combined input respects both cooldowns', () => {
  const state = setup();
  const player = state.players[0];
  player.dashCooldown = 0.3;
  player.strikeCooldown = 0.3;
  Object.assign(player.input, { dash: true, strike: true });
  stepGame(state, 1 / 30);
  assert.equal(player.x, 500);
  assert.equal(player.dashTime, 0);
  assert.equal(player.strikeTime, 0);
});
