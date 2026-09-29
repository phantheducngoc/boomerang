import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { retrieveWeapon } from '../shared/retrieval.js';
import { strike } from '../shared/melee.js';
import { collides } from '../shared/physics.js';
import { parryWeapon } from '../shared/parry.js';

function setup(range=420) {
  const state=createGame([createPlayer('a','Owner','mint'),createPlayer('b','Defender','peach')]);
  Object.assign(state.players[0],{x:130,y:120,aim:0});
  Object.assign(state.players[1],{x:400,y:120,aim:Math.PI});
  throwWeapon(state,state.players[0],range);
  return state;
}

test('power increases launch speed, acceleration, and distance over equal time',()=> {
  const low=setup(130), high=setup(420);
  const initialLow=low.projectiles[0].speed, initialHigh=high.projectiles[0].speed;
  assert.ok(initialHigh>initialLow);
  updateWeapons(low,.05);updateWeapons(high,.05);
  assert.ok(high.projectiles[0].x>low.projectiles[0].x);
  assert.ok(low.projectiles[0].speed>initialLow);
  assert.ok(high.projectiles[0].speed-initialHigh>low.projectiles[0].speed-initialLow);
});

test('striking outbound or returning weapons changes direction and cancels homing',()=> {
  for(const returning of [false,true]) {
    const state=setup();
    const weapon=state.projectiles[0];
    Object.assign(weapon,{x:350,y:120,safeX:350,safeY:120,returning});
    strike(state,state.players[1]);
    assert.equal(weapon.mode,'deflected');
    assert.equal(weapon.returning,false);
    assert.equal(weapon.angle,Math.PI);
    updateWeapons(state,.1);
    assert.ok(weapon.x<350);
    assert.ok(weapon.speed<390);
    assert.equal(state.players[1].alive,true);
  }
});

test('an active swing intercepts a fast projectile before body contact',()=> {
  const state=setup();
  state.players[1].x=260;
  strike(state,state.players[1]);
  assert.equal(state.projectiles[0].mode,'flying');
  updateWeapons(state,.1);
  assert.equal(state.projectiles[0].mode,'deflected');
  assert.equal(state.players[1].alive,true);
});

test('grounded weapons persist, cannot hurt, prevent another throw, and only owner picks up',()=> {
  const state=setup();
  Object.assign(state.projectiles[0],{x:350,y:120,safeX:350,safeY:120});
  strike(state,state.players[1]);
  updateWeapons(state,.6);
  const weapon=state.projectiles[0];
  assert.equal(weapon.mode,'grounded');
  const x=weapon.x;
  assert.equal(collides(weapon.x,weapon.y,20),false);
  Object.assign(state.players[1],{x:weapon.x,y:weapon.y});
  updateWeapons(state,5);
  assert.equal(weapon.x,x);
  assert.equal(state.players[1].alive,true);
  assert.equal(state.projectiles.length,1);
  throwWeapon(state,state.players[0]);
  assert.equal(state.projectiles.length,1);
  Object.assign(state.players[0],{x:weapon.x,y:weapon.y});
  updateWeapons(state,1/30);
  assert.equal(state.projectiles.length,1);
  assert.equal(retrieveWeapon(state,state.players[0]),true);
  assert.equal(state.projectiles.length,0);
  throwWeapon(state,state.players[0]);
  assert.equal(state.projectiles[0].mode,'flying');
});

test('deflected weapons stop before cover and stay on reachable ground',()=> {
  const state=setup();
  const weapon=state.projectiles[0];
  Object.assign(weapon,{x:240,y:225,safeX:240,safeY:225,mode:'deflected',angle:0,speed:310,fallTime:0});
  updateWeapons(state,.6);
  assert.equal(weapon.mode,'grounded');
  assert.ok(weapon.x<=250);
  assert.equal(collides(weapon.x,weapon.y,20),false);
});

test('own weapons, rear attacks, and expired swings do not parry',()=> {
  const state=setup();
  const weapon=state.projectiles[0];
  Object.assign(weapon,{x:170,y:120});
  strike(state,state.players[0]);
  assert.equal(weapon.mode,'flying');
  Object.assign(weapon,{x:350,y:120});
  state.players[1].aim=0;
  strike(state,state.players[1]);
  assert.equal(weapon.mode,'flying');
  state.players[1].strikeTime=0;
  state.players[1].strikeAim=Math.PI;
  updateWeapons(state,.02);
  assert.equal(weapon.mode,'flying');
});

test('front slash blocks, but rear crossings and already-contacting weapons do not',()=> {
  const state=setup();
  const defender=state.players[1];
  defender.strikeTime=0.2;
  defender.strikeAim=0;
  defender.strikeKind='swing';
  const weapon=state.projectiles[0];
  Object.assign(weapon,{x:450,y:120});
  assert.equal(parryWeapon(state,weapon,defender,{x:390,y:120}),false);
  assert.equal(parryWeapon(state,weapon,defender,{x:405,y:120}),false);
  assert.equal(parryWeapon(state,weapon,defender,{x:455,y:120}),true);
});

test('a rear projectile hits a slashing player instead of being blocked',()=> {
  const state=setup();
  const defender=state.players[1];
  defender.aim=0;
  strike(state,defender);
  Object.assign(state.projectiles[0],{x:365,y:120,angle:0,launchAim:0,speed:780});
  updateWeapons(state,1/30);
  assert.equal(defender.alive,false);
  assert.equal(state.projectiles[0].mode,'flying');
});
