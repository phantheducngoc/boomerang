import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { strike } from '../shared/melee.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { RULES } from '../shared/config.js';
import { recallWeapon, retrieveWeapon } from '../shared/retrieval.js';

test('throwing and striking together kicks the opponent instead of slashing',()=> {
  const state=setup();
  const [player,target]=state.players;
  target.x=560;
  Object.assign(player.input,{throw:true,strike:true,aim:0});
  stepGame(state,1/30);
  assert.equal(player.strikeKind,'kick');
  assert.equal(target.alive,true);
  assert.ok(target.x>560);
  assert.equal(player.score,0);
});

function setup(elapsed = 3) {
  const state = createGame([createPlayer('a', 'A', 'mint'), createPlayer('b', 'B', 'peach')]);
  state.phase = 'playing';
  state.remaining = RULES.roundTime - elapsed;
  Object.assign(state.players[0], { x: 500, y: 120, aim: 0 });
  Object.assign(state.players[1], { x: 850, y: 120, aim: Math.PI });
  return state;
}

test('strike kicks during the opening two seconds, then swings when armed', () => {
  for (const elapsed of [0, 1.99, 2]) {
    const state = setup(elapsed);
    strike(state, state.players[0]);
    assert.equal(state.players[0].strikeKind, elapsed < 2 ? 'kick' : 'swing');
  }
});

test('strike kicks while your boomerang is flying or grounded', () => {
  for (const mode of ['flying', 'grounded']) {
    const state = setup();
    const player = state.players[0];
    throwWeapon(state, player);
    state.projectiles[0].mode = mode;
    strike(state, player);
    assert.equal(player.strikeKind, 'kick');
    assert.equal(player.strikeTime, RULES.strikeTime);
  }
});

test('kicks knock enemy boomerangs farther than armed swings and leave them grounded', () => {
  const distances = [];
  for (const elapsed of [3, 1]) {
    const state = setup(elapsed);
    throwWeapon(state, state.players[1]);
    const weapon = state.projectiles[0];
    Object.assign(weapon, { x: 550, y: 120, safeX: 550, safeY: 120 });
    strike(state, state.players[0]);
    assert.equal(weapon.mode, 'deflected');
    assert.equal(weapon.angle, 0);
    updateWeapons(state, 1);
    assert.equal(weapon.mode, 'grounded');
    distances.push(weapon.x - 550);
  }
  assert.ok(distances[1] > distances[0] + 25);
});

test('a kicked boomerang can be picked up and thrown by another player', () => {
  const state = setup();
  const [picker, owner] = state.players;
  throwWeapon(state, picker);
  throwWeapon(state, owner);
  const weapon = state.projectiles[1];
  Object.assign(weapon, { x: 550, y: 120, safeX: 550, safeY: 120 });
  strike(state, picker);
  assert.equal(weapon.sharedPickup, true);
  assert.equal(retrieveWeapon(state, picker), false);
  updateWeapons(state, 0.6);
  assert.equal(weapon.mode, 'grounded');
  Object.assign(picker, { x: weapon.x, y: weapon.y });
  assert.equal(retrieveWeapon(state, picker), true);
  assert.equal(picker.pickupCharges, 1);
  assert.equal(owner.weaponCount, 0);
  const beforeOwnerThrow = state.projectiles.length;
  throwWeapon(state, owner);
  assert.equal(state.projectiles.length, beforeOwnerThrow);
  owner.strikeCooldown = 0;
  strike(state, owner);
  assert.equal(owner.strikeKind, 'kick');
  const count = state.projectiles.length;
  throwWeapon(state, picker);
  assert.equal(state.projectiles.length, count + 1);
  assert.equal(picker.pickupCharges, 0);
});

test('an active kick intercepts recall and the shared drop cannot be recalled again',()=> {
  const state=setup();
  const [defender,owner]=state.players;
  defender.aim=0;
  owner.x=300;
  owner.input.recall=true;
  throwWeapon(state,defender);
  throwWeapon(state,owner);
  const weapon=state.projectiles[1];
  Object.assign(weapon,{x:610,y:120,safeX:610,safeY:120,mode:'grounded'});
  recallWeapon(state,owner);
  weapon.recallWindup=0;
  weapon.pullTime=1;
  strike(state,defender);
  updateWeapons(state,0.06);
  assert.equal(weapon.mode,'deflected');
  assert.equal(weapon.recalling,false);
  assert.equal(weapon.sharedPickup,true);
  updateWeapons(state,0.6);
  assert.equal(weapon.mode,'grounded');
  assert.equal(recallWeapon(state,owner),false);
  assert.equal(weapon.mode,'grounded');
});

test('kicking an armed opponent disarms them without killing or duplicating weapons',()=> {
  const state=setup();
  const [kicker,target]=state.players;
  throwWeapon(state,kicker);
  target.x=560;
  strike(state,kicker);
  assert.equal(kicker.strikeKind,'kick');
  assert.equal(target.alive,true);
  const dropped=state.projectiles.find(weapon=>weapon.owner===target.id);
  assert.ok(dropped);
  assert.equal(dropped.mode,'deflected');
  assert.equal(dropped.sharedPickup,true);
  assert.equal(dropped.angle,kicker.strikeAim);
  const count=state.projectiles.length;
  throwWeapon(state,target);
  assert.equal(state.projectiles.length,count);
  state.projectiles.find(weapon=>weapon.owner===kicker.id).mode='grounded';
  updateWeapons(state,0.6);
  assert.equal(dropped.mode,'grounded');
});

test('kicking an unarmed opponent does not create another boomerang',()=> {
  const state=setup();
  const [kicker,target]=state.players;
  throwWeapon(state,kicker);
  throwWeapon(state,target);
  target.x=560;
  strike(state,kicker);
  assert.equal(state.projectiles.length,2);
  assert.equal(target.alive,true);
});
