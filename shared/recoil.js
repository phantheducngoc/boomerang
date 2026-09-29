import { movePlayer } from './physics.js';

export function bumpPlayers(player, other) {
  const playerDashing = player.dashTime > 0;
  const otherDashing = other.dashTime > 0;
  if (!playerDashing && !otherDashing && (player.bumpCooldown > 0 || other.bumpCooldown > 0)) return;
  const dx = player.x - other.x;
  const dy = player.y - other.y;
  const length = Math.hypot(dx, dy) || 1;
  const x = length === 1 && dx === 0 && dy === 0 ? 1 : dx / length;
  const y = dy / length;
  for (const [target, sign] of [[player, 1], [other, -1]]) {
    const incomingDash = target === player ? otherDashing : playerDashing;
    const ownDash = target === player ? playerDashing : otherDashing;
    const force = incomingDash ? 700 : ownDash ? 100 : 160;
    target.recoilX = x * force * sign;
    target.recoilY = y * force * sign;
    target.bumpCooldown = 0.25;
    target.dashTime = 0;
  }
}

export function updateRecoil(players, dt, broken = []) {
  for (const player of players) {
    player.bumpCooldown = Math.max(0, (player.bumpCooldown || 0) - dt);
    if (!player.alive || player.fallElapsed != null) continue;
    const decay = Math.exp(-12 * dt);
    const travelTime = (1 - decay) / 12;
    movePlayer(player, player.recoilX || 0, player.recoilY || 0, travelTime, players, undefined, broken);
    player.recoilX = (player.recoilX || 0) * decay;
    player.recoilY = (player.recoilY || 0) * decay;
  }
}
