import { SPAWNS } from './config.js';
import { offIsland, outwardDirection } from './islands.js';

function splashEvent(state, player, text) {
  state.events.push({ id: ++state.sequence, type: 'fall', x: player.x, y: player.y,
    color: player.character, text });
}

export function resolveFalls(state, dt) {
  state.players.forEach((player, index) => {
    if (!player.alive || !offIsland(player.x, player.y)) return;
    if (player.fallElapsed == null) {
      player.fallElapsed = 0;
      const outward = outwardDirection(player.x, player.y);
      player.fallStartX = player.x;
      player.fallStartY = player.y;
      player.fallDriftX = outward.x * 34;
      player.fallDriftY = outward.y * 34;
      player.dashTime = 0;
      player.strikeTime = 0;
      player.recoilX = 0;
      player.recoilY = 0;
      return;
    }
    player.fallElapsed += dt;
    const progress = Math.min(1, player.fallElapsed / 0.7);
    const drift = 1 - (1 - progress) ** 2;
    if (Number.isFinite(player.fallStartX)) {
      player.x = player.fallStartX + player.fallDriftX * drift;
      player.y = player.fallStartY + player.fallDriftY * drift;
    }
    if (player.fallElapsed < 0.7 - 1e-9) return;
    if (player.invincible) {
      splashEvent(state, player, `${player.name} washed back ash!`);
      [player.x, player.y] = SPAWNS[index];
      player.recoilX = 0;
      player.recoilY = 0;
      player.dashTime = 0;
      player.fallElapsed = null;
      return;
    }
    player.alive = false;
    player.fallen = true;
    splashEvent(state, player, `${player.name} fell into the water!`);
  });
}
