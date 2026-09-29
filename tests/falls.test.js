import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { SPAWNS } from '../shared/config.js';
import { strike } from '../shared/melee.js';
import { hitPlayers } from '../shared/projectile-hits.js';
import { resolveFalls } from '../shared/falls.js';
import { offIsland } from '../shared/islands.js';

test('fall drifts farther from the edge and splashes at the final position',()=> {
  const state=playing();
  const player=state.players[0];
  player.input.x=-1;
  stepGame(state,0.25);
  const start={x:player.x,y:player.y};
  stepGame(state,0.35);
  assert.ok(player.x<start.x);
  assert.equal(offIsland(player.x,player.y),true);
  assert.equal(player.alive,true);
  stepGame(state,0.35);
  assert.ok(Math.abs(Math.hypot(player.x-start.x,player.y-start.y)-34)<0.001);
  assert.equal(state.events.at(-1).x,player.x);
  assert.equal(state.events.at(-1).y,player.y);
});

function playing(invincible = false) {
  const state = createGame([
    createPlayer('a','Edge Runner','mint'),
    createPlayer('b','Survivor','peach')
  ]);
  state.phase = 'playing';
  state.remaining = 50;
  Object.assign(state.players[0], { x:180, y:480, invincible });
  Object.assign(state.players[1], { x:900, y:300 });
  return state;
}

test('walking or dashing over the shoreline falls into the water', () => {
  for (const dash of [false,true]) {
    const state = playing();
    Object.assign(state.players[0].input, { x:-1, dash });
    stepGame(state, dash ? 0.1 : 0.25);
    assert.equal(state.players[0].alive,true);
    stepGame(state,0.49);
    assert.equal(state.players[0].alive,true);
    stepGame(state,0.21);
    assert.equal(state.players[0].alive,false);
    assert.equal(state.players[0].fallen,true);
    assert.equal(state.events.at(-1).type,'fall');
    assert.match(state.events.at(-1).text,/fell into the water/);
  }
});

test('recoil can knock a player into water', () => {
  const state = playing();
  Object.assign(state.players[0], { x:160, recoilX:-700, recoilY:0 });
  stepGame(state,0.1);
  stepGame(state,0.7);
  assert.equal(state.players[0].fallen,true);
});

test('no-death practice splashes and returns the player to shore', () => {
  const state = playing(true);
  state.players[0].input.x=-1;
  stepGame(state,0.25);
  stepGame(state,0.7);
  assert.equal(state.players[0].alive,true);
  assert.equal(state.players[0].fallen,false);
  assert.deepEqual([state.players[0].x,state.players[0].y],SPAWNS[0]);
  assert.match(state.events.at(-1).text,/washed back ash/);
});

test('opponents can kill during both the fall pause and descent',()=> {
  for (const elapsed of [0.2,0.6]) {
    for (const attack of ['slash','boomerang']) {
      const state=playing();
      const [target,attacker]=state.players;
      Object.assign(target,{x:140,y:480,fallElapsed:elapsed});
      Object.assign(attacker,{x:200,y:480,aim:Math.PI});
      if (attack==='slash') strike(state,attacker);
      else hitPlayers(state,{mode:'flying',x:130,y:480},attacker,{x:170,y:480});
      assert.equal(target.alive,false,`${attack} at ${elapsed}`);
      assert.equal(target.fallen,true);
      assert.equal(target.fallElapsed,null);
      assert.equal(state.events.length,1);
      resolveFalls(state,1);
      assert.equal(state.events.length,1,'No duplicate fall death');
    }
  }
});

test('no-death practice still protects falling characters from attacks',()=> {
  const state=playing(true);
  const [target,attacker]=state.players;
  Object.assign(target,{x:140,y:480,fallElapsed:0.2});
  Object.assign(attacker,{x:200,y:480,aim:Math.PI});
  strike(state,attacker);
  hitPlayers(state,{mode:'flying',x:130,y:480},attacker,{x:170,y:480});
  assert.equal(target.alive,true);
});
