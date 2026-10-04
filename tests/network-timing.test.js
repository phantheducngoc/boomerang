import test from 'node:test';
import assert from 'node:assert/strict';
import { snapshotDelay, NETWORK_TICK_SECONDS } from '../shared/network-timing.js';

test('remote interpolation uses two ticks and grows only for jitter', () => {
  assert.equal(snapshotDelay(), NETWORK_TICK_SECONDS * 2000);
  assert.ok(snapshotDelay(10) > snapshotDelay());
  assert.equal(snapshotDelay(200), 100);
  assert.equal(snapshotDelay(-1), snapshotDelay());
});
