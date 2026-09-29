import test from 'node:test';
import assert from 'node:assert/strict';
import { TREE_OBSTACLES } from '../shared/trees.js';
import { RULES, WORLD } from '../shared/config.js';
import { movePlayer, hitsObstacle } from '../shared/physics.js';

test('walking, jumping and fast lunges cannot cross either tree trunk', () => {
  for (const box of TREE_OBSTACLES) {
    const cx = box.x + box.w / 2;
    const cy = box.y + box.h / 2;
    for (const speed of [RULES.speed, RULES.dashSpeed, 1600]) {
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const player = { id: 'test', x: cx - dx * 65, y: cy - dy * 65, alive: true };
        movePlayer(player, dx * speed, dy * speed, 130 / speed);
        assert.ok((player.x - cx) * dx + (player.y - cy) * dy < 0,
          'movement must stop on the approach side of the trunk');
        assert.equal(hitsObstacle(player.x, player.y, WORLD.radius), false);
      }
    }
  }
});
