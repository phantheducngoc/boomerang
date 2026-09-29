import test from 'node:test';
import assert from 'node:assert/strict';
import { GamepadInput } from '../public/js/gamepad.js';
import { createGame, createPlayer, stepGame } from '../shared/game.js';

function fixture() {
  let now=0;
  let pads=[{index:0,connected:true,mapping:'standard',axes:[0,0,0,0],
    buttons:Array.from({length:17},()=>({pressed:false,value:0}))}];
  const pad=pads[0];
  const input=new GamepadInput(()=>pads,()=>now);
  input.read();
  return {input,pad,press:(index,on=true)=>{pad.buttons[index]={pressed:on,value:on?1:0};},
    time:value=>now=value,pads:value=>pads=value};
}

test('analog sticks have a dead zone, normalized speed, and persistent aim',()=> {
  const f=fixture();
  f.pad.axes=[.1,-.1,0,0];
  assert.equal(f.input.read().x,0);
  f.pad.axes=[1,1,0,-1];
  const result=f.input.read();
  assert.ok(Math.abs(Math.hypot(result.x,result.y)-1)<.001);
  assert.equal(result.aim,-Math.PI/2);
  f.pad.axes=[0,0,0,0];
  assert.equal(f.input.read().aim,-Math.PI/2);
});

test('trigger throws on release, dash uses fresh presses, and strike uses rising edges',()=> {
  const f=fixture();
  f.press(3);f.input.read();f.time(900);
  assert.equal(f.input.chargedRange(),630);
  assert.equal(f.input.read().throw,false);
  f.press(3,false);
  assert.equal(f.input.read().range,630);
  assert.equal(f.input.read().throw,false);
  f.press(0);f.press(2);
  const first=f.input.read();
  assert.equal(first.dash,true);assert.equal(first.strike,true);
  const held=f.input.read();
  assert.equal(held.dash,false);
  assert.equal(held.strike,false);
  f.press(0,false);f.input.read();f.press(0);
  assert.equal(f.input.read().dash,true);
});

test('holding dash does not repeat after cooldown; a fresh press is required',()=> {
  const f=fixture();
  const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
  state.phase='playing';
  state.remaining=55;
  const player=state.players[0];
  const tick=()=> { player.input=f.input.read(); stepGame(state,1/30); };
  f.press(0);
  tick();
  assert.ok(player.dashTime>0);
  for (let i=0;i<10;i++) tick();
  assert.equal(player.dashTime,0);
  assert.ok(player.dashCooldown>0);
  let repeated=false;
  for (let i=0;i<6;i++) { tick(); repeated ||= player.dashTime>0; }
  assert.equal(repeated,false);
  f.press(0,false);
  for (let i=0;i<65;i++) tick();
  assert.equal(player.dashTime,0);
  assert.equal(player.dashCooldown,0);
  f.press(0);
  tick();
  assert.ok(player.dashTime>0);
});

test('movement aims strikes and throws, with right stick override and neutral retention',()=> {
  for (const axes of [[-1,0,0,0],[0,-1,0,0],[0,1,0,0],[1,1,0,0],[1,0,0,-1]]) {
    const f=fixture();
    const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
    state.phase='playing';
    state.remaining=55;
    const player=state.players[0];
    const expected=axes[2] || axes[3] ? Math.atan2(axes[3],axes[2]) : Math.atan2(axes[1],axes[0]);
    f.pad.axes=axes;
    f.press(2);
    player.input=f.input.read();
    stepGame(state,1/180);
    assert.equal(player.strikeAim,expected);
    f.press(2,false);
    f.press(3);
    f.input.read();
    f.pad.axes=[0,0,0,0];
    f.time(400);
    f.press(3,false);
    player.input=f.input.read();
    assert.equal(player.input.throw,true);
    stepGame(state,1/180);
    assert.equal(state.projectiles.length,1);
    assert.equal(state.projectiles[0].angle,expected);
  }
});

test('disconnect and reset cancel charges and require release before rearming',()=> {
  const f=fixture();
  f.press(3);f.input.read();f.time(1000);
  f.pads([]);assert.equal(f.input.read(),null);
  f.pads([f.pad]);f.input.read();f.press(3,false);
  assert.equal(f.input.read().throw,false);
  f.press(3);f.input.read();f.input.reset();f.press(3,false);
  assert.equal(f.input.read().throw,false);
  f.press(3);f.input.read();f.time(1100);f.press(3,false);
  assert.equal(f.input.read().throw,true);
});

test('unsupported mappings and blocked API access degrade safely',()=> {
  const f=fixture();f.pad.mapping='';
  assert.equal(f.input.read(),null);
  assert.match(f.input.status(),/unsupported/);
  const blocked=new GamepadInput(()=>{throw new Error('Blocked');});
  assert.equal(blocked.read(),null);
});

test('X and B strike; A and right shoulder dash; old trigger no longer throws',()=> {
  for (const index of [1,2]) {
    const f=fixture();
    f.press(index);
    assert.equal(f.input.read().strike,true);
    assert.equal(f.input.read().strike,false);
  }
  for (const index of [0,5]) {
    const f=fixture();
    f.press(index);
    assert.equal(f.input.read().dash,true);
    assert.equal(f.input.read().dash,false);
    f.press(index,false);
    assert.equal(f.input.read().dash,false);
  }
  const f=fixture();
  f.press(7);
  assert.equal(f.input.read().recall,false);
  f.press(7,false);
  assert.equal(f.input.read().throw,false);
});

test('charging locks movement until release; dash cancels without a delayed throw',()=> {
  for (const cancel of [false,true]) {
    const f=fixture();
    const state=createGame([createPlayer('a','A','mint'),createPlayer('b','B','peach')]);
    state.phase='playing'; state.remaining=55;
    const player=state.players[0];
    const start=player.x;
    f.pad.axes=[1,0,0,0];
    f.press(3);
    player.input=f.input.read();
    assert.equal(player.input.charging,true);
    stepGame(state,1/30);
    assert.equal(player.x,start);
    if (cancel) {
      f.press(0);
      player.input=f.input.read();
      assert.equal(player.input.charging,false);
      stepGame(state,1/30);
      assert.ok(player.x>start);
      f.press(0,false);
      assert.equal(f.input.read().charging,false,'Held throw stays cancelled');
    }
    f.press(3,false);
    player.input=f.input.read();
    assert.equal(player.input.throw,!cancel);
    stepGame(state,1/30);
    assert.ok(player.x>start);
    assert.equal(state.projectiles.length,cancel?0:1);
  }
});
