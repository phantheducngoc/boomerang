import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { strike, resolveStrike } from '../shared/melee.js';
import { RULES } from '../shared/config.js';

function setup() {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  state.phase='playing'; state.remaining=55;
  Object.assign(state.players[0],{x:500,y:120,aim:0});
  Object.assign(state.players[1],{x:610,y:120});
  return state;
}

test('an active slash connects after moving into range without pressing again',()=> {
  const state=setup();
  const [player,target]=state.players;
  strike(state,player);
  assert.equal(target.alive,true);
  player.input.x=1;
  stepGame(state,1/30);
  assert.equal(target.alive,true);
  stepGame(state,1/30);
  assert.equal(target.alive,false);
  assert.equal(state.events.length,1);
  resolveStrike(state,player);
  assert.equal(state.events.length,1);
});

test('expired swings cannot hit, and changing aim does not rotate an active slash',()=> {
  const state=setup();
  const [player,target]=state.players;
  strike(state,player);
  player.aim=Math.PI;
  target.x=450;
  resolveStrike(state,player);
  assert.equal(target.alive,true);
  target.x=550;
  player.strikeTime=0;
  resolveStrike(state,player);
  assert.equal(target.alive,true);
  player.strikeTime=RULES.strikeTime;
  resolveStrike(state,player);
  assert.equal(target.alive,false);
});
