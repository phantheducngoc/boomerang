import test from 'node:test';
import assert from 'node:assert/strict';
import { strikePose } from '../public/js/art/strike.js';
import { RULES } from '../shared/config.js';

test('right-hand slash and body sweep from right to left, with a mirrored left swing', () => {
  for (const hand of ['right', 'left']) {
    const player = { alive: true, strikeKind: 'swing', strikeHand: hand, strikeTime: RULES.strikeTime };
    const start = strikePose(player);
    player.strikeTime = RULES.strikeTime * 0.5;
    const middle = strikePose(player);
    const side = hand === 'right' ? 1 : -1;
    assert.ok(start.angle * side > 0);
    assert.ok(start.bodyTurn * side > 0);
    assert.ok(middle.angle * side < 0);
    assert.ok(middle.bodyTurn * side < 0);
    player.strikeTime = 1e-9;
    assert.ok(Math.abs(strikePose(player).bodyTurn) < 1e-6);
  }
});
