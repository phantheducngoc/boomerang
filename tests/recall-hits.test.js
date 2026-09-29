import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { recallWeapon } from '../shared/retrieval.js';
import { strike } from '../shared/melee.js';

function setup() {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  state.phase='playing'; state.remaining=55;
  const [owner,target]=state.players;
  Object.assign(owner,{x:200,y:120});
  Object.assign(target,{x:420,y:120,aim:0});
  throwWeapon(state,owner);
  const weapon=state.projectiles[0];
  Object.assign(weapon,{x:600,y:120,mode:'grounded'});
  owner.input.recall=true;
  recallWeapon(state,owner);
  weapon.recallWindup=0;
  weapon.pullTime=1;
  return state;
}

test('fast recall hits opponents on its path and never its owner',()=> {
  const state=setup();
  updateWeapons(state,0.4);
  assert.equal(state.players[1].alive,false);
  assert.equal(state.players[0].alive,true);
  assert.equal(state.events.length,1);
});

test('recall respects dodge, practice immunity and a forward parry',()=> {
  for (const protection of ['dash','invincible','parry']) {
    const state=setup();
    const target=state.players[1];
    if (protection==='dash') target.dashTime=1;
    if (protection==='invincible') target.invincible=true;
    if (protection==='parry') strike(state,target);
    updateWeapons(state,0.3);
    assert.equal(target.alive,true,protection);
    if (protection==='parry') assert.notEqual(state.projectiles[0].mode,'flying');
  }
});

test('releasing recall makes the grounded boomerang harmless',()=> {
  const state=setup();
  state.players[0].input.recall=false;
  state.players[1].x=600;
  updateWeapons(state,0.1);
  assert.equal(state.players[1].alive,true);
  assert.equal(state.projectiles[0].mode,'grounded');
});
