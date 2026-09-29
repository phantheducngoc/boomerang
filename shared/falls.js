import { SPAWNS } from './config.js';
import { offIsland } from './islands.js';

function splashEvent(state, player, text) {
  state.events.push({ id: ++state.sequence, type: 'fall', x: player.x, y: player.y,
    color: player.character, text });
}

export function resolveFalls(state) {
  state.players.forEach((player, index) => {
    if (!player.alive || !offIsland(player.x, player.y)) return;
    if (player.invincible) {
      splashEvent(state, player, `${player.name} washed back ash!`);
      [player.x, player.y] = SPAWNS[index];
      player.recoilX = 0;
      player.recoilY = 0;
      player.dashTime = 0;
      return;
    }
    player.alive = false;
    player.fallen = true;
    splashEvent(state, player, `${player.name} fell into the water!`);
  });
}
