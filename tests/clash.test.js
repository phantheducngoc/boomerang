import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';

function facingPair() {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  state.phase='playing';
  state.remaining=50;
  Object.assign(state.players[0],{x:600,y:600,aim:0});
  Object.assign(state.players[1],{x:720,y:600,aim:Math.PI});
  return state;
}

test('simultaneous opposing slashes clash and push both players back',()=> {
  const state=facingPair();
  Object.assign(state.players[0].input,{strike:true,aim:0});
  Object.assign(state.players[1].input,{strike:true,aim:Math.PI});
  stepGame(state,1/30);
  const [a,b]=state.players;
  assert.equal(a.alive,true);
  assert.equal(b.alive,true);
  assert.ok(a.recoilX<0);
  assert.ok(b.recoilX>0);
  assert.equal(state.events.filter(event=>event.type==='clash').length,1);
  const before=[a.x,b.x];
  stepGame(state,1/30);
  assert.ok(a.x<before[0]);
  assert.ok(b.x>before[1]);
});

test('slashes that do not face each other do not clash',()=> {
  const state=facingPair();
  Object.assign(state.players[0].input,{strike:true,aim:0});
  Object.assign(state.players[1].input,{strike:true,aim:0});
  stepGame(state,1/30);
  assert.equal(state.events.some(event=>event.type==='clash'),false);
});
