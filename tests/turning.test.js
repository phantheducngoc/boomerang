import test from 'node:test';
import assert from 'node:assert/strict';
import { smoothFacing, frontVisibility, bodyProjection, rollProjection } from '../public/js/art/turning.js';

test('turning takes the short route across the angle boundary',()=> {
  const current=Math.PI-0.05;
  const next=smoothFacing(current,-Math.PI+0.05,1/60);
  assert.ok(next>current && next<current+0.1);
});

test('sushi keeps a solid rounded profile through a full turn', () => {
  for (let angle = -Math.PI; angle <= Math.PI; angle += 0.01) {
    assert.ok(rollProjection(angle).width >= 0.85);
    assert.ok(Math.abs(rollProjection(angle + 0.01).width - rollProjection(angle).width) < 0.01);
  }
  assert.equal(rollProjection(0).width, 0.85);
  assert.equal(rollProjection(Math.PI / 2).width, 1);
});

test('quarter turns expose thickness and hide the front at the side and back', () => {
  assert.equal(bodyProjection(Math.PI / 2).width, 1);
  assert.equal(bodyProjection(0, 28).depth, 28);
  assert.equal(bodyProjection(0).width, 0);
  assert.equal(frontVisibility(0), 0);
  assert.equal(bodyProjection(-Math.PI / 2).back, true);
  assert.equal(frontVisibility(-Math.PI / 2), 0);
  const before = bodyProjection(-0.001);
  const after = bodyProjection(0.001);
  assert.ok(Math.abs(before.width - after.width) < 1e-9);
  assert.ok(Math.abs(before.depth - after.depth) < 1e-9);
});

test('turn smoothing is independent of frame rate',()=> {
  let a=0,b=0;
  for(let i=0;i<30;i++) a=smoothFacing(a,2,1/30);
  for(let i=0;i<120;i++) b=smoothFacing(b,2,1/120);
  assert.ok(Math.abs(a-b)<1e-10);
});

test('front and back details fade continuously during a full turn',()=> {
  assert.equal(frontVisibility(Math.PI/2),1);
  assert.equal(frontVisibility(-Math.PI/2),0);
  for(let angle=-Math.PI;angle<Math.PI;angle+=0.01) {
    assert.ok(Math.abs(frontVisibility(angle+0.01)-frontVisibility(angle))<0.03);
  }
});
