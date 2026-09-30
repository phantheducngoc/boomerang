import test from 'node:test';
import assert from 'node:assert/strict';
import { chargeArrowDistance } from '../public/js/art/aim-arrow.js';
import { RULES } from '../shared/config.js';

test('charge chevron advances with throw range and stops at full charge', () => {
  const near = chargeArrowDistance(RULES.minRange);
  const middle = chargeArrowDistance((RULES.minRange + RULES.maxRange) / 2);
  const far = chargeArrowDistance(RULES.maxRange);
  assert.ok(near < middle && middle < far);
  assert.equal(chargeArrowDistance(RULES.maxRange * 2), far);
  assert.equal(chargeArrowDistance(0), near);
});
