import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { recallWeapon, retrieveWeapon } from '../shared/retrieval.js';
import { collides } from '../shared/physics.js';
import { RoomService } from '../server/rooms.js';
import { GamepadInput } from '../public/js/gamepad.js';
import { input as validateInput } from '../server/validation.js';

function setup() {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  Object.assign(state.players[0],{x:200,y:225,aim:0});
  Object.assign(state.players[1],{x:850,y:510});
  state.phase='playing';state.remaining=60;
  throwWeapon(state,state.players[0]);
  return state;
}

test('returning projectile stops at cover, remains reachable, and persists',()=> {
  const state=setup();
  const weapon=state.projectiles[0];
  Object.assign(weapon,{x:420,y:225,safeX:420,safeY:225,returning:true});
  updateWeapons(state,.5);
  assert.equal(weapon.mode,'grounded');
  assert.ok(weapon.x>=395);
  assert.equal(collides(weapon.x,weapon.y,20),false);
  const x=weapon.x;
  updateWeapons(state,5);
  assert.equal(weapon.x,x);
  assert.equal(state.projectiles.length,1);
});

test('retrieval requires living owner, distance and grounded state',()=> {
  const state=setup();
  const [owner,other]=state.players;
  const weapon=state.projectiles[0];
  Object.assign(weapon,{mode:'grounded',x:420,y:120});
  assert.equal(retrieveWeapon(state,owner),false);
  Object.assign(other,{x:420,y:120});
  assert.equal(retrieveWeapon(state,other),false);
  Object.assign(owner,{x:420,y:120,alive:false});
  assert.equal(retrieveWeapon(state,owner),false);
  owner.alive=true;
  updateWeapons(state,.1);
  assert.equal(state.projectiles.length,1);
  weapon.mode='deflected';
  assert.equal(retrieveWeapon(state,owner),false);
  weapon.mode='grounded';
  owner.input.retrieve=true;
  owner.input.strike=true;
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,0);
  assert.equal(owner.strikeCooldown,0,'Controller retrieval takes priority over striking');
  assert.equal(owner.input.retrieve,false);
});

test('walking into range automatically retrieves only your grounded boomerang',()=> {
  const state=setup();
  const [owner,other]=state.players;
  Object.assign(owner,{x:200,y:120});
  Object.assign(other,{x:240,y:120});
  Object.assign(state.projectiles[0],{mode:'grounded',x:240,y:120});
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,1,'Other players cannot pick up your weapon');
  other.y=180;
  owner.input.x=1;
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,1,'Weapon remains outside pickup range');
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,0,'Walking into range needs no retrieve button');
});

test('automatic pickup preserves keyboard strikes and ignores flying weapons',()=> {
  const state=setup();
  const owner=state.players[0];
  Object.assign(owner,{x:200,y:120});
  Object.assign(state.projectiles[0],{mode:'deflected',x:200,y:120});
  stepGame(state,1/180);
  assert.equal(state.projectiles.length,1);
  state.projectiles[0].mode='grounded';
  owner.input.strike=true;
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,0);
  assert.ok(owner.strikeCooldown>0);
});

test('controller strike fallback still works when no weapon is in reach',()=> {
  const state=setup();
  state.players[0].input.retrieve=true;
  state.players[0].input.strike=true;
  stepGame(state,1/30);
  assert.ok(state.players[0].strikeCooldown>0);
});

test('holding the throw trigger allows pickup and throws only after release',()=> {
  const state=setup();
  state.remaining=55;
  const owner=state.players[0];
  Object.assign(owner,{x:200,y:120});
  Object.assign(state.projectiles[0],{mode:'grounded',x:240,y:120});
  const pad={index:0,connected:true,mapping:'standard',axes:[1,0,0,0],
    buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  const controller=new GamepadInput(()=>[pad],()=>0);
  controller.read();
  pad.buttons[3].pressed=true;
  for (let i=0;i<15;i++) {
    owner.input=controller.read();
    assert.equal(owner.input.throw,false);
    stepGame(state,1/30);
  }
  assert.equal(state.projectiles.length,0,'Pickup works while charging');
  pad.axes=[0,0,0,0];
  owner.input=controller.read();
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,0,'Holding does not rethrow');
  pad.buttons[3].pressed=false;
  owner.input=controller.read();
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,1,'Release throws the retrieved weapon');
});

test('retrieval action survives network input buffering',()=> {
  const rooms=new RoomService(()=>{});
  const host={id:'host'};
  rooms.handle(host,{type:'create'});
  rooms.handle({id:'guest'},{type:'join',code:host.room});
  rooms.handle(host,{type:'start'});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,retrieve:true});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,retrieve:false});
  assert.equal(rooms.rooms.get(host.room).members.get(host.id).player.input.retrieve,true);
});

test('holding throw recalls a distant grounded weapon through validated controller input',()=> {
  const state=setup();
  state.remaining=55;
  const owner=state.players[0];
  Object.assign(owner,{x:200,y:120});
  Object.assign(state.projectiles[0],{mode:'grounded',x:500,y:120});
  const pad={index:0,connected:true,mapping:'standard',axes:[0,0,0,0],
    buttons:Array.from({length:17},()=>({pressed:false,value:0}))};
  const controller=new GamepadInput(()=>[pad],()=>0);
  controller.read();
  pad.buttons[3].pressed=true;
  for (let i=0;i<60;i++) {
    owner.input=validateInput({...controller.read(),aim:0});
    stepGame(state,1/30);
    if (i===12) {
      assert.equal(state.projectiles[0].returning,true);
      assert.ok(state.projectiles[0].x<500);
    }
  }
  assert.equal(state.projectiles.length,0,'Held trigger recalls without automatically rethrowing');
});

test('cover blocks recall and leaves the boomerang on reachable ground',()=> {
  const state=setup();
  const weapon=state.projectiles[0];
  Object.assign(weapon,{mode:'grounded',x:420,y:225});
  for (let i=0;i<30;i++) {
    state.players[0].input.recall=true;
    stepGame(state,1/30);
  }
  assert.equal(state.projectiles.length,1);
  assert.ok(weapon.x>=395);
  assert.equal(collides(weapon.x,weapon.y,20),false);
});

test('an ordinary recalled weapon remains owner-only if it drops against cover again',()=> {
  const state=setup();
  const [owner,other]=state.players;
  const weapon=state.projectiles[0];
  Object.assign(weapon,{mode:'grounded',sharedPickup:false,x:420,y:225});
  assert.equal(recallWeapon(state,owner),true);
  owner.input.recall=true;
  assert.equal(weapon.sharedPickup,false);
  updateWeapons(state,0.5);
  assert.equal(weapon.mode,'grounded');
  assert.equal(weapon.sharedPickup,false);
  Object.assign(other,{x:weapon.x,y:weapon.y});
  assert.equal(retrieveWeapon(state,other),false);
  Object.assign(owner,{x:weapon.x,y:weapon.y});
  assert.equal(retrieveWeapon(state,owner),true);
});

test('releasing recall drops the weapon, and holding again resumes its return',()=> {
  const state=setup();
  const owner=state.players[0];
  Object.assign(owner,{x:200,y:120});
  const weapon=state.projectiles[0];
  Object.assign(weapon,{mode:'grounded',x:600,y:120,safeX:600,safeY:120});
  owner.input.recall=true;
  recallWeapon(state,owner);
  updateWeapons(state,0.4);
  assert.ok(weapon.x<600);
  const beforeRelease=weapon.x;
  owner.input.recall=false;
  updateWeapons(state,0.4);
  assert.equal(weapon.mode,'grounded');
  assert.equal(weapon.returning,false);
  assert.equal(weapon.x,beforeRelease);
  updateWeapons(state,0.2);
  assert.equal(weapon.x,beforeRelease);
  owner.input.recall=true;
  recallWeapon(state,owner);
  updateWeapons(state,0.4);
  assert.ok(weapon.x<beforeRelease);
});
