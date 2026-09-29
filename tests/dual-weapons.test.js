import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { throwWeapon } from '../shared/combat.js';
import { retrieveWeapon } from '../shared/retrieval.js';
import { heldWeaponCount } from '../shared/weapon-inventory.js';

test('collecting an enemy weapon fills both hands and allows two separate throws',()=> {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  const [player,other]=state.players;
  Object.assign(player,{x:500,y:120});
  throwWeapon(state,other);
  Object.assign(state.projectiles[0],{mode:'grounded',sharedPickup:true,x:500,y:120});
  assert.equal(retrieveWeapon(state,player),true);
  assert.equal(heldWeaponCount(state,player),2);
  assert.equal(heldWeaponCount(state,other),0);
  throwWeapon(state,player);
  assert.equal(heldWeaponCount(state,player),1);
  throwWeapon(state,player);
  assert.equal(heldWeaponCount(state,player),0);
  throwWeapon(state,player);
  assert.equal(state.projectiles.length,2);
  Object.assign(state.projectiles[0],{mode:'grounded',x:500,y:120});
  retrieveWeapon(state,player);
  assert.equal(heldWeaponCount(state,player),1);
});
