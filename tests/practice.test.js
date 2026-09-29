import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { strike } from '../shared/melee.js';
import { profile } from '../server/validation.js';

function setup(invincible) {
  const state=createGame([createPlayer('a','Bot','mint',true),createPlayer('b','Player','peach')]);
  state.phase='playing'; state.remaining=55;
  Object.assign(state.players[0],{x:130,y:120,aim:0});
  Object.assign(state.players[1],{x:180,y:120,invincible});
  return state;
}

test('no-death practice survives projectiles and kicks while normal play remains lethal',()=> {
  for (const invincible of [false,true]) {
    const flight=setup(invincible);
    throwWeapon(flight,flight.players[0]);
    updateWeapons(flight,.15);
    assert.equal(flight.players[1].alive,invincible);
    const melee=setup(invincible);
    melee.remaining=60;
    strike(melee,melee.players[0]);
    assert.equal(melee.players[0].strikeKind,'kick');
    assert.equal(melee.players[1].alive,true);
    const armed=setup(invincible);
    strike(armed,armed.players[0]);
    assert.equal(armed.players[0].strikeKind,'swing');
    assert.equal(armed.players[1].alive,invincible);
  }
});

test('no-death setting persists into the next round',()=> {
  const state=setup(true);
  state.phase='roundOver'; state.remaining=0;
  stepGame(state,1/30);
  assert.equal(state.players[1].invincible,true);
});

test('online profiles cannot enable practice invincibility',()=> {
  assert.equal(profile({name:'Player',character:'mint',invincible:true}).invincible,undefined);
});
