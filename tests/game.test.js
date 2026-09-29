import test from 'node:test';
import assert from 'node:assert/strict';
import { createPlayer, createGame, stepGame } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { movePlayer, collides } from '../shared/physics.js';
import { RULES, SPAWNS, WORLD, OBSTACLES } from '../shared/config.js';
import { offIsland } from '../shared/islands.js';

function playing() {
  const state=createGame([createPlayer('a','Mint','mint'),createPlayer('b','Peach','peach')]);
  state.phase='playing';
  state.remaining=60;
  return state;
}

test('movement sets facing independently from aim and preserves it when stopped',()=> {
  for (const [x,y] of [[1,0],[-1,0],[0,1],[0,-1],[1,-1]]) {
    const state=playing();
    const player=state.players[0];
    player.input.x=x;
    player.input.y=y;
    player.input.aim=0.7;
    stepGame(state,1/30);
    assert.equal(player.facing,Math.atan2(y,x));
    assert.equal(player.aim,0.7);
    player.input.x=0;
    player.input.y=0;
    stepGame(state,1/30);
    assert.equal(player.facing,Math.atan2(y,x));
  }
});

test('facing follows the committed dash direction and resets each round',()=> {
  const state=playing();
  const player=state.players[0];
  player.input.y=-1;
  player.input.dash=true;
  stepGame(state,1/30);
  player.input.y=1;
  stepGame(state,1/30);
  assert.equal(player.facing,-Math.PI/2);
  state.phase='roundOver';
  state.remaining=0;
  stepGame(state,1/30);
  assert.equal(player.facing,Math.PI/2);
});

test('countdown prevents movement and starts the round',()=> {
  const state=playing();
  state.phase='countdown';
  state.remaining=1;
  state.players[0].input.x=1;
  const x=state.players[0].x;
  stepGame(state,.5);
  assert.equal(state.players[0].x,x);
  stepGame(state,.5);
  assert.equal(state.phase,'playing');
  assert.equal(state.remaining,60);
});

test('diagonal movement is normalized; high speed movement cannot cross cover',()=> {
  const state=playing();
  const player=state.players[0];
  const before={x:player.x,y:player.y};
  player.input={x:1,y:1,aim:0,throw:false,dash:false};
  stepGame(state,.1);
  assert.ok(Math.abs(Math.hypot(player.x-before.x,player.y-before.y)-RULES.speed*.1)<.01);
  player.x=220;
  player.y=225;
  movePlayer(player,1000,0,.2);
  assert.ok(player.x<=250);
  assert.equal(collides(player.x,player.y),false);
});

test('a player owns one boomerang until it comes back',t=> {
  const obstacles=OBSTACLES.splice(0);
  t.after(()=>OBSTACLES.push(...obstacles));
  const state=playing();
  state.players[0].y=500;
  throwWeapon(state,state.players[0]);
  throwWeapon(state,state.players[0]);
  assert.equal(state.projectiles.length,1);
  for (let i=0;i<90;i++) updateWeapons(state,1/30);
  assert.equal(state.projectiles.length,0);
});

test('hit detection catches swept throws and dash grants invulnerability',()=> {
  const state=playing();
  const [owner,target]=state.players;
  owner.x=130; owner.y=320; owner.aim=0;
  target.x=180; target.y=320; target.dashTime=.1;
  throwWeapon(state,owner);
  updateWeapons(state,.1);
  assert.equal(target.alive,true);
  state.projectiles=[];
  target.dashTime=0;
  throwWeapon(state,owner);
  updateWeapons(state,.15);
  assert.equal(target.alive,false);
  stepGame(state,1/30);
  assert.equal(owner.score,1);
  assert.equal(state.phase,'roundOver');
});

test('outgoing throws turn around at cover',()=> {
  const state=playing();
  const player=state.players[0];
  player.x=240; player.y=220; player.aim=0;
  throwWeapon(state,player);
  updateWeapons(state,1/30);
  assert.equal(state.projectiles[0].returning,false);
  updateWeapons(state,1/30);
  assert.equal(state.projectiles.length,1);
  assert.ok(state.projectiles[0].x<270);
  assert.ok(state.projectiles[0].returning || state.projectiles[0].mode==='grounded');
});

test('the garden is larger and every spawn has room to stand',()=> {
  assert.ok(WORLD.width>=1500 && WORLD.height>=990);
  for (const [x,y] of SPAWNS) {
    assert.equal(collides(x,y),false);
    assert.equal(offIsland(x,y,WORLD.radius),false);
    assert.ok(x>90 && y>90 && x<WORLD.width-90 && y<WORLD.height-90);
  }
  assert.equal(offIsland(40,500),true);
  assert.equal(collides(700,580),false);
});

test('a throw is present immediately, and a bounce off nearby cover stays visible',()=> {
  const open=playing();
  open.players[0].x=500;
  open.players[0].y=120;
  open.players[0].aim=0;
  throwWeapon(open,open.players[0],RULES.maxRange);
  updateWeapons(open,1/30);
  assert.equal(open.projectiles.length,1);
  assert.equal(open.projectiles[0].mode,'flying');
  assert.ok(open.projectiles[0].x>500);
  const blocked=playing();
  blocked.players[0].x=240;
  blocked.players[0].y=220;
  blocked.players[0].aim=0;
  throwWeapon(blocked,blocked.players[0],RULES.minRange);
  for (let i=0;i<45;i++) updateWeapons(blocked,1/30);
  assert.equal(blocked.projectiles.length,1);
  assert.equal(blocked.projectiles[0].mode,'grounded');
});

test('the boomerang stays absent for the first two seconds of a round',()=> {
  const state=playing();
  state.players[0].input.throw=true;
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,0);
  state.remaining=RULES.roundTime-RULES.boomerangDelay;
  state.players[0].input.throw=true;
  stepGame(state,1/30);
  assert.equal(state.projectiles.length,1);
});

test('five round wins finish the match; timeouts with multiple survivors draw',()=> {
  const state=playing();
  state.players[0].score=4;
  state.players[1].alive=false;
  stepGame(state,1/30);
  assert.equal(state.phase,'finished');
  assert.equal(state.champion,'a');
  const draw=playing();
  draw.remaining=0;
  stepGame(draw,1/30);
  assert.equal(draw.winner,null);
  assert.ok(draw.players.every(player=>player.score===0));
});
