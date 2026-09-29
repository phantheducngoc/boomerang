import { RULES } from './config.js';
import { collides, distance } from './physics.js';

export function recallWeapon(state, player) {
  if (!player.alive) return false;
  const weapon = state.projectiles.find(item => item.owner === player.id && item.mode === 'grounded');
  if (!weapon || weapon.recalling || weapon.sharedPickup) return false;
  Object.assign(weapon, { mode: 'grounded', recallWindup: RULES.recallWindup, returning: true, recalling: true, loopReturn: false, sharedPickup: false, departed: true, age: 0,
    safeX: weapon.x, safeY: weapon.y, speed: RULES.recallStartSpeed, pullTime: 0, slideTarget: null, blocked: false,
    maxSpeed: RULES.projectileSpeed, power: 0 });
  return true;
}

export function retrieveWeapon(state, player) {
  if (!player.alive) return false;
  const weapon = state.projectiles.find(item => item.mode === 'grounded'
    && (item.owner === player.id || item.sharedPickup)
    && reachable(player, item, state.brokenObstacles));
  if (!weapon) return false;
  if (weapon.owner !== player.id) {
    const previousOwner = state.players.find(item => item.id === weapon.owner);
    if (previousOwner) previousOwner.weaponCount = Math.max(0, (previousOwner.weaponCount ?? 1) - 1);
    player.weaponCount = (player.weaponCount ?? 1) + 1;
    player.pickupCharges = (player.pickupCharges || 0) + 1;
  }
  state.projectiles = state.projectiles.filter(item => item.id !== weapon.id);
  return true;
}

function reachable(player, weapon, broken = []) {
  if (distance(player, weapon) > RULES.pickupRadius) return false;
  const steps = Math.max(1, Math.ceil(distance(player, weapon) / 4));
  for (let i = 1; i < steps; i++) {
    if (collides(player.x + (weapon.x - player.x) * i / steps,
      player.y + (weapon.y - player.y) * i / steps, 1, broken)) return false;
  }
  return true;
}
