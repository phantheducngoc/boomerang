import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { updateBots } from '../shared/bots.js';
import { botLevel } from '../shared/bot-levels.js';

function setup(difficulty) {
  const state = createGame([createPlayer('bot1', 'Bot', 'mint', true), createPlayer('human', 'Human', 'peach')]);
  Object.assign(state.players[0], { x: 500, y: 120, difficulty });
  Object.assign(state.players[1], { x: 850, y: 120 });
  return state;
}

test('levels progressively increase movement speed and aim accuracy', () => {
  const inputs = ['easy', 'medium', 'hard'].map(level => {
    const state = setup(level);
    updateBots(state, 0);
    return state.players[0].input;
  });
  for (let i = 1; i < inputs.length; i++) {
    assert.ok(Math.hypot(inputs[i].x, inputs[i].y) > Math.hypot(inputs[i-1].x, inputs[i-1].y));
    assert.ok(Math.abs(inputs[i].aim) < Math.abs(inputs[i-1].aim));
  }
});

test('hard bots react sooner; easy bots do not dodge; grounded weapons are not threats', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    const state = setup(level);
    const weapon = { owner: 'human', x: 610, y: 120, mode: 'flying' };
    state.projectiles.push(weapon);
    updateBots(state, 0);
    assert.equal(state.players[0].input.dash, level === 'hard');
    weapon.x = 530;
    updateBots(state, 0);
    assert.equal(state.players[0].input.dash, level !== 'easy');
    weapon.mode = 'grounded';
    updateBots(state, 0);
    assert.equal(state.players[0].input.dash, false);
  }
});

test('hard bots recall dropped weapons; other levels walk to retrieve', () => {
  for (const level of ['easy', 'medium', 'hard']) {
    const state = setup(level);
    state.projectiles.push({ owner: 'bot1', x: 700, y: 120, mode: 'grounded' });
    updateBots(state, 0);
    const input = state.players[0].input;
    assert.equal(input.recall, level === 'hard');
    assert.equal(input.retrieve, level !== 'hard');
  }
});

test('missing and invalid difficulty default to medium', () => {
  for (const value of [undefined, null, 'invalid', '__proto__']) assert.equal(botLevel(value), 'medium');
  const state = setup('invalid');
  updateBots(state, 0);
  assert.ok(Number.isFinite(state.players[0].input.aim));
});

test('hard bots get more firing opportunities than medium and easy bots', () => {
  const counts = ['easy', 'medium', 'hard'].map(level => {
    const state = setup(level);
    let count = 0;
    let previous = false;
    for (let i = 0; i < 1800; i++) {
      updateBots(state, i / 30);
      const firing = state.players[0].input.throw;
      if (firing && !previous) count++;
      previous = firing;
    }
    return count;
  });
  assert.ok(counts[0] < counts[1] && counts[1] < counts[2]);
});
