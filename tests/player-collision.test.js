import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { movePlayer, distance } from '../shared/physics.js';
import { WORLD } from '../shared/config.js';
import { bumpPlayers, updateRecoil } from '../shared/recoil.js';

function pair() {
  const players=[createPlayer('a','A','mint'),createPlayer('b','B','peach')];
  Object.assign(players[0],{x:500,y:120});
  Object.assign(players[1],{x:560,y:120});
  return players;
}

test('body contact recoils both players, fades out, and cannot stack each substep',()=> {
  const players=pair();
  players[0].x=520;
  movePlayer(players[0],210,0,1/30,players,bumpPlayers);
  assert.ok(players[0].recoilX<0);
  assert.ok(players[1].recoilX>0);
  const force=players[1].recoilX;
  bumpPlayers(...players);
  assert.equal(players[1].recoilX,force);
  updateRecoil(players,1/30);
  assert.ok(players[0].x<520);
  assert.ok(players[1].x>560);
  assert.ok(players[1].recoilX<force);
});

test('walking and fast dashes cannot pass through living players',()=> {
  for (const speed of [210,660,2000]) {
    const players=pair();
    movePlayer(players[0],speed,0,0.3,players);
    assert.ok(players[0].x<players[1].x);
    assert.ok(distance(...players)>=WORLD.radius*2);
  }
});

test('players can slide past, move away, and pass eliminated characters',()=> {
  const players=pair();
  players[0].x=520;
  movePlayer(players[0],210,210,0.2,players);
  assert.ok(players[0].y>120);
  assert.ok(distance(...players)>=40);
  const x=players[0].x;
  movePlayer(players[0],-210,0,0.1,players);
  assert.ok(players[0].x<x);
  Object.assign(players[0],{x:500,y:120});
  players[1].alive=false;
  movePlayer(players[0],660,0,0.2,players);
  assert.ok(players[0].x>players[1].x);
});

test('simulation applies collisions to both players moving toward each other',()=> {
  const state=createGame(pair());
  Object.assign(state.players[0],{x:500,y:120});
  Object.assign(state.players[1],{x:560,y:120});
  state.phase='playing'; state.remaining=55;
  state.players[0].input.x=1;
  state.players[1].input.x=-1;
  for (let i=0;i<10;i++) stepGame(state,1/30);
  assert.ok(distance(...state.players)>=40);
  assert.ok(state.players[0].x<state.players[1].x);
});
