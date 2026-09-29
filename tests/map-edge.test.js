import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, createPlayer } from '../shared/game.js';
import { throwWeapon, updateWeapons } from '../shared/combat.js';
import { RULES, WORLD } from '../shared/config.js';
import { outsideArena } from '../shared/physics.js';

test('throws at every map edge turn back and are caught instead of dropping',()=> {
  for (const [x,y,aim] of [[85,120,Math.PI],[WORLD.width-85,120,0],
    [500,85,-Math.PI/2],[500,WORLD.height-85,Math.PI/2]]) {
    for (const alreadyReturning of [false,true]) {
      const owner=createPlayer('a','A','mint');
      const state=createGame([owner]);
      Object.assign(owner,{x,y,aim});
      throwWeapon(state,owner,RULES.maxRange);
      const weapon=state.projectiles[0];
      if (alreadyReturning) {
        weapon.returning=true;
        weapon.loopReturn=true;
        weapon.departed=true;
      }
      for (let i=0;i<360 && state.projectiles.length;i++) {
        updateWeapons(state,1/180);
        assert.equal(weapon.mode,'flying');
        assert.equal(outsideArena(weapon.x,weapon.y,8),false);
      }
      assert.equal(state.projectiles.length,0);
    }
  }
});
