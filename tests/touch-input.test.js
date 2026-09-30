import test from 'node:test';
import assert from 'node:assert/strict';
import { clampStick, TouchInput } from '../public/js/touch-input.js';

test('the stick ignores a small nudge and keeps full deflection inside its circle', () => {
  assert.deepEqual(clampStick(2, 1, 50), { dx: 0, dy: 0, x: 0, y: 0 });
  const full = clampStick(80, 0, 50);
  assert.equal(full.dx, 50);
  assert.equal(full.x, 1);
});

test('throw charges while held and fires on release', () => {
  let now = 0;
  const input = new TouchInput(() => now);
  input.read();
  input.setHeld('throw', true);
  input.touching = true;
  assert.equal(input.read().throw, false);
  assert.equal(input.read().charging, true);
  now = 900;
  input.setHeld('throw', false);
  const released = input.read();
  assert.equal(released.throw, true);
  assert.equal(released.range, 820);
  assert.equal(input.read().throw, false);
});

test('dash and strike fire once per press', () => {
  const input = new TouchInput();
  input.read();
  input.setHeld('dash', true);
  input.setHeld('strike', true);
  const first = input.read();
  assert.equal(first.dash, true);
  assert.equal(first.strike, true);
  assert.equal(input.read().dash, false);
});

test('aim stays where the stick was released', () => {
  const input = new TouchInput();
  input.setAim(0, -1);
  input.setAim(0, 0);
  assert.equal(input.read().aim, -Math.PI / 2);
});
