import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { strike } from '../shared/melee.js';
import { movePlayer } from '../shared/physics.js';
import { OBSTACLES } from '../shared/config.js';

function setup(armed = true) {
  const state=createGame([createPlayer('a','Slasher','mint'),createPlayer('b','Other','peach')]);
  state.phase='playing';
  state.remaining=armed?50:60;
  Object.assign(state.players[0],{x:580,y:432,aim:0});
  Object.assign(state.players[1],{x:1000,y:600});
  return state;
}

test('a slash breaks a crate and leaves a passable obstacle',()=> {
  const state=setup();
  const crateIndex=OBSTACLES.findIndex(box=>box.kind==='crate');
  strike(state,state.players[0]);
  assert.deepEqual(state.brokenObstacles,[crateIndex]);
  assert.equal(state.events.at(-1).type,'crate');
  assert.match(state.events.at(-1).text,/smashed a crate/);
  state.players[0].x=580;
  movePlayer(state.players[0],180,0,1,[],undefined,state.brokenObstacles);
  assert.ok(state.players[0].x>OBSTACLES[crateIndex].x+OBSTACLES[crateIndex].w);
});

test('an intact crate blocks movement and a kick cannot break it',()=> {
  const intact=setup();
  movePlayer(intact.players[0],180,0,1);
  assert.ok(intact.players[0].x<OBSTACLES[1].x);
  const kick=setup(false);
  strike(kick,kick.players[0]);
  assert.equal(kick.players[0].strikeKind,'kick');
  assert.deepEqual(kick.brokenObstacles,[]);
});

test('broken crates return intact next round',()=> {
  const state=setup();
  strike(state,state.players[0]);
  state.phase='roundOver';
  state.remaining=0;
  stepGame(state,1/30);
  assert.deepEqual(state.brokenObstacles,[]);
});
