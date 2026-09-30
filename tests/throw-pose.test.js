import test from 'node:test';
import assert from 'node:assert/strict';
import { throwPose } from '../public/js/art/throw-pose.js';
import { RULES } from '../shared/config.js';

test('charged body turns sideways then rotates toward the committed throw', () => {
  const player = { alive: true, input: { charging: true }, throwChargeTime: 0.3 };
  assert.equal(throwPose(player, 1).bodyTurn, Math.PI / 2);
  Object.assign(player, { throwPoseTime: RULES.throwPoseTime, throwAim: 1,
    throwBodyTurn: Math.PI / 2 });
  assert.equal(throwPose(player, 0).bodyTurn, Math.PI / 2);
  player.throwPoseTime = RULES.throwPoseTime * 0.2;
  assert.equal(throwPose(player, 0).bodyTurn, 0);
  assert.equal(throwPose(player, 0).aim, 1);
});
