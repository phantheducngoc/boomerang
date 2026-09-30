import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { recallWeapon } from '../shared/retrieval.js';
import { RULES } from '../shared/config.js';

test('holding throw recalls an offshore flying weapon immediately and release drops it', () => {
  const owner = createPlayer('a', 'A', 'mint');
  const state = createGame([owner]);
  Object.assign(owner, { x: 130, y: 120, aim: Math.PI });
  throwWeapon(state, owner, RULES.maxRange);
  const weapon = state.projectiles[0];
  for (let i = 0; i < 180; i++) updateWeapons(state, 1 / 180);
  assert.ok(weapon.x < 0);
  assert.equal(weapon.mode, 'flying');
  owner.input.recall = true;
  assert.equal(recallWeapon(state, owner), true);
  assert.equal(weapon.recallWindup, 0);
  const before = weapon.x;
  updateWeapons(state, 0.1);
  assert.ok(weapon.x > before);
  assert.equal(weapon.blocked, false);
  owner.input.recall = false;
  updateWeapons(state, 0.01);
  assert.equal(weapon.mode, 'grounded');
  assert.equal(weapon.recalling, false);
});
