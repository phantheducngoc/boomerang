import { RULES, WORLD } from './config.js';
import { collides } from './physics.js';
import { inStrikeArc } from './strike-geometry.js';

export function parryWeapon(state, weapon, player, previous = weapon) {
  if (!player.alive || player.strikeTime <= 0 || weapon.owner === player.id ||
      weapon.mode !== 'flying'
      || !inStrikeArc(player, weapon, player.strikeAim, 0, state.brokenObstacles)) return false;
  const dx = previous.x - player.x;
  const dy = previous.y - player.y;
  // A rear hit must not become a parry after crossing the player's center.
  if (dx * Math.cos(player.strikeAim) + dy * Math.sin(player.strikeAim) <= 0
      || Math.hypot(dx, dy) < WORLD.radius) return false;
  weapon.mode = 'deflected';
  weapon.sharedPickup = player.strikeKind === 'kick';
  weapon.returning = false;
  weapon.recalling = false;
  weapon.angle = player.strikeAim;
  weapon.speed = player.strikeKind === 'kick' ? RULES.kickDeflectSpeed : RULES.deflectSpeed;
  weapon.fallTime = 0;
  // Keep every dropped weapon on reachable ground.
  if (collides(weapon.x, weapon.y, 20, state.brokenObstacles)) {
    weapon.x = weapon.safeX;
    weapon.y = weapon.safeY;
  }
  state.events.push({ id: ++state.sequence, type: player.strikeKind === 'kick' ? 'kick' : 'parry', angle: player.strikeAim, x: weapon.x, y: weapon.y,
    color: player.character, text: `${player.name} parried a boomerang!` });
  return true;
}

export function updateDropped(weapon, dt, broken = []) {
  if (weapon.mode === 'deflected') {
    const speed = Math.max(0, weapon.speed - RULES.deflectDrag * dt);
    const travel = (weapon.speed + speed) / 2 * dt;
    const x = weapon.x + Math.cos(weapon.angle) * travel;
    const y = weapon.y + Math.sin(weapon.angle) * travel;
    if (!collides(x, y, 20, broken)) { weapon.x = x; weapon.y = y; weapon.speed = speed; }
    else weapon.speed = 0;
    weapon.fallTime += dt;
    if (weapon.speed === 0) weapon.mode = 'grounded';
  }
  // Pickup is an explicit player action handled by the retrieval service.
  return true;
}
