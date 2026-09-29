import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { SPAWNS } from '../shared/config.js';

function playing(invincible = false) {
  const state = createGame([
    createPlayer('a','Edge Runner','mint'),
    createPlayer('b','Survivor','peach')
  ]);
  state.phase = 'playing';
  state.remaining = 50;
  Object.assign(state.players[0], { x:180, y:480, invincible });
  Object.assign(state.players[1], { x:900, y:300 });
  return state;
}

test('walking or dashing over the shoreline falls into the water', () => {
  for (const dash of [false,true]) {
    const state = playing();
    Object.assign(state.players[0].input, { x:-1, dash });
    stepGame(state, dash ? 0.1 : 0.25);
    assert.equal(state.players[0].alive,false);
    assert.equal(state.players[0].fallen,true);
    assert.equal(state.events.at(-1).type,'fall');
    assert.match(state.events.at(-1).text,/fell into the water/);
  }
});

test('recoil can knock a player into water', () => {
  const state = playing();
  Object.assign(state.players[0], { x:160, recoilX:-700, recoilY:0 });
  stepGame(state,0.1);
  assert.equal(state.players[0].fallen,true);
});

test('no-death practice splashes and returns the player to shore', () => {
  const state = playing(true);
  state.players[0].input.x=-1;
  stepGame(state,0.25);
  assert.equal(state.players[0].alive,true);
  assert.equal(state.players[0].fallen,false);
  assert.deepEqual([state.players[0].x,state.players[0].y],SPAWNS[0]);
  assert.match(state.events.at(-1).text,/washed back ash/);
});
