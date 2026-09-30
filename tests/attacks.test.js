import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, createGame, stepGame } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { strike } from '../shared/melee.js';
import { RULES, OBSTACLES } from '../shared/config.js';
import { input } from '../server/validation.js';
import { RoomService } from '../server/rooms.js';

function fixture() {
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  state.phase='playing';
  state.remaining=55;
  Object.assign(state.players[0],{x:130,y:120,aim:0});
  Object.assign(state.players[1],{x:190,y:120});
  return state;
}

test('short and long throws reach their selected distances and return',t=> {
  const obstacles=OBSTACLES.splice(0);
  t.after(()=>OBSTACLES.push(...obstacles));
  for (const range of [RULES.minRange,RULES.maxRange]) {
    const state=fixture();
    state.players[0].y=600;
    state.players[1].y=500;
    throwWeapon(state,state.players[0],range);
    let max=0;
    for (let i=0;i<1080;i++) {
      updateWeapons(state,1/180);
      if (state.projectiles.length && !state.projectiles[0].returning) max=Math.max(max,state.projectiles[0].traveled);
    }
    assert.ok(Math.abs(max-range)<.001);
    assert.equal(state.projectiles.length,0);
  }
});

test('server range validation bounds malformed or excessive ranges',()=> {
  for (const [range,expected] of [[-20,180],[999999,820],[NaN,180],[Infinity,180],['420',180],[300,300]]) {
    assert.equal(input({x:0,y:0,aim:0,range}).range,expected);
  }
  const state=fixture();
  throwWeapon(state,state.players[0],Infinity);
  assert.equal(state.projectiles[0].range,180);
});

test('armed forward strikes eliminate and award round wins',()=> {
  const state=fixture();
  const player=state.players[0];
  player.input={x:0,y:0,aim:0,strike:true};
  stepGame(state,1/30);
  assert.equal(state.players[1].alive,false);
  assert.equal(player.score,1);
  assert.equal(state.phase,'roundOver');
  assert.ok(player.strikeTime>0);
});

test('strikes cannot hit behind, out of range, through cover, or during dash',()=> {
  for (const position of [{x:80,y:120},{x:230,y:120},{x:190,y:120,dashTime:.1}]) {
    const state=fixture();
    Object.assign(state.players[1],position);
    strike(state,state.players[0]);
    assert.equal(state.players[1].alive,true);
  }
  const state=fixture();
  Object.assign(state.players[0],{x:300,y:190,aim:Math.PI/2});
  Object.assign(state.players[1],{x:300,y:265});
  strike(state,state.players[0]);
  assert.equal(state.players[1].alive,true);
});

test('strike cooldown prevents repeat hits and resets for a new round',()=> {
  const state=fixture();
  const [player,target]=state.players;
  target.x=240;
  strike(state,player);
  target.x=190;
  strike(state,player);
  assert.equal(target.alive,true);
  player.strikeCooldown=0;
  strike(state,player);
  assert.equal(target.alive,false);
  stepGame(state,1/30);
  state.remaining=0;
  stepGame(state,1/30);
  assert.equal(player.strikeCooldown,0);
  assert.equal(player.strikeTime,0);
});

test('room buffering preserves charged range and strike until simulation tick',()=> {
  const rooms=new RoomService(()=>{});
  const host={id:'host'};
  rooms.handle(host,{type:'create'});
  rooms.handle({id:'guest'},{type:'join',code:host.room});
  rooms.handle(host,{type:'start'});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,throw:true,range:420,strike:true});
  rooms.handle(host,{type:'input',x:0,y:0,aim:0,range:130});
  const room=rooms.rooms.get(host.room);
  const player=room.members.get(host.id).player;
  assert.equal(player.input.range,420);
  assert.equal(player.input.strike,true);
  room.game.phase='playing';
  room.game.remaining=58;
  rooms.tick(1/30);
  assert.equal(room.game.projectiles[0].range,420);
  assert.ok(player.strikeCooldown>0);
  assert.equal(player.input.strike,false);
});
