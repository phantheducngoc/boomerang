import { RULES } from './config.js';
import { movePlayer } from './physics.js';

export function startStrikeMotion(player) {
  const x = Math.cos(player.strikeAim);
  const y = Math.sin(player.strikeAim);
  const speed = Math.max(0, (player.motionX ?? 0) * x + (player.motionY ?? 0) * y);
  player.strikeLungeDistance = Math.min(90, RULES.strikeLungeDistance * speed / RULES.speed);
  player.strikeLungeElapsed = 0;
  player.strikeLungeX = x;
  player.strikeLungeY = y;
}

export function updateStrikeMotion(state, dt) {
  for (const player of state.players) {
    if (!player.alive || player.fallElapsed != null || !player.strikeLungeDistance) continue;
    const before = player.strikeLungeElapsed;
    const after = Math.min(RULES.strikeLungeTime, before + dt);
    // A short decelerating burst, integrated independently of frame rate.
    const progress = time => 1 - (1 - time / RULES.strikeLungeTime) ** 2;
    const travel = player.strikeLungeDistance * (progress(after) - progress(before));
    movePlayer(player, player.strikeLungeX * travel, player.strikeLungeY * travel,
      1, state.players, undefined, state.brokenObstacles);
    player.strikeLungeElapsed = after;
    if (after >= RULES.strikeLungeTime) player.strikeLungeDistance = 0;
  }
}
