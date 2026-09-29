import test from 'node:test';
import assert from 'node:assert/strict';
import { strikeReach, inStrikeArc } from '../shared/strike-geometry.js';
import { returnAngle, throwAngle } from '../shared/throw-path.js';

test('body-edge hits work in every facing direction, including angle wraparound',()=> {
  for (let i=0;i<16;i++) {
    const aim=i*Math.PI/8;
    const player={x:1350,y:400,strikeAim:aim};
    const target={x:player.x+Math.cos(aim)*97.99,y:player.y+Math.sin(aim)*97.99};
    assert.equal(inStrikeArc(player,target,aim,20),true,`Facing ${aim}`);
    assert.equal(inStrikeArc(player,target,aim+Math.PI,20),false);
  }
});

test('slash catches body overlap at the outer and side edges without hitting through cover',()=> {
  const player={x:500,y:120,strikeAim:0};
  assert.equal(inStrikeArc(player,{x:595,y:120},0,20),true);
  assert.equal(inStrikeArc(player,{x:600,y:120},0,20),false);
  const angle=Math.PI/3+0.15;
  assert.equal(inStrikeArc(player,{x:500+Math.cos(angle)*70,y:120+Math.sin(angle)*70},0,20),true);
  assert.equal(inStrikeArc(player,{x:450,y:120},0,20),false);
  assert.equal(inStrikeArc({x:240,y:225,strikeAim:0},{x:305,y:225},0,20),false);
});

test('slash reach and hit checks stop at the same obstacle face',()=> {
  const player={x:240,y:225,strikeAim:0};
  assert.equal(strikeReach(player,0),29);
  assert.equal(inStrikeArc(player,{x:268,y:225}),true);
  assert.equal(inStrikeArc(player,{x:280,y:225}),false);
  assert.equal(inStrikeArc(player,{x:305,y:225}),false);
});

test('outward throws stay straight at every charge level',()=> {
  for (const power of [0,0.2,0.6,0.99,1]) {
    for (const progress of [0,0.25,0.5,0.75,1]) {
      assert.equal(throwAngle(0.7,power,progress),0.7);
    }
  }
});

test('natural return has a slight curve that disappears near the catch',()=> {
  const owner={x:0,y:0};
  const weapon={x:300,y:0,range:600,loopReturn:true};
  assert.ok(Math.abs(returnAngle(weapon,owner)-Math.PI-0.12)<1e-10);
  weapon.x=1;
  assert.ok(Math.abs(returnAngle(weapon,owner)-Math.PI)<0.001);
  weapon.loopReturn=false;
  assert.equal(returnAngle(weapon,owner),Math.PI);
});
