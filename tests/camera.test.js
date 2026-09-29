import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, screenToWorld, worldToScreen } from '../public/js/camera.js';

test('2.5D camera round-trips pointer coordinates', () => {
  for (const point of [{x:0,y:0},{x:750,y:495},{x:1500,y:990}]) {
    const screen = worldToScreen(point.x, point.y);
    const world = screenToWorld(screen.x, screen.y);
    assert.ok(Math.abs(world.x-point.x)<1e-9);
    assert.ok(Math.abs(world.y-point.y)<1e-9);
  }
});

test('2.5D camera foreshortens depth and keeps the arena visible', () => {
  assert.ok(CAMERA.scaleY<CAMERA.scaleX);
  const top=worldToScreen(0,0);
  const bottom=worldToScreen(1500,990);
  assert.ok(top.x>=0 && top.y>=0);
  assert.ok(bottom.x<=1500 && bottom.y<=990);
});
