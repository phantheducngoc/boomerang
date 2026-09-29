import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMERA, screenToWorld, worldToScreen, updateCamera } from '../public/js/camera.js';

test('2.5D camera round-trips pointer coordinates', () => {
  for (const point of [{x:0,y:0},{x:750,y:495},{x:1500,y:990}]) {
    const screen = worldToScreen(point.x, point.y);
    const world = screenToWorld(screen.x, screen.y);
    assert.ok(Math.abs(world.x-point.x)<1e-9);
    assert.ok(Math.abs(world.y-point.y)<1e-9);
  }
});

test('camera frames offshore throws and preserves aim at reduced zoom', () => {
  const view = { zoom: 1 };
  const weapons = [{ x: -550, y: -400 }, { x: 2050, y: 1390 }];
  updateCamera(view, weapons, 1 / 60);
  assert.ok(view.zoom < 1);
  for (const weapon of weapons) {
    const screen = worldToScreen(weapon.x, weapon.y, view);
    assert.ok(screen.x > 0 && screen.x < 1500 && screen.y > 0 && screen.y < 990);
    const world = screenToWorld(screen.x, screen.y, view);
    assert.ok(Math.hypot(world.x - weapon.x, world.y - weapon.y) < 1e-8);
  }
  const previous = view.zoom;
  updateCamera(view, [], 1 / 60);
  assert.ok(view.zoom > previous && view.zoom < 1);
});

test('2.5D camera foreshortens depth and keeps the arena visible', () => {
  assert.ok(CAMERA.scaleY<CAMERA.scaleX);
  const top=worldToScreen(0,0);
  const bottom=worldToScreen(1500,990);
  assert.ok(top.x>=0 && top.y>=0);
  assert.ok(bottom.x<=1500 && bottom.y<=990);
});
