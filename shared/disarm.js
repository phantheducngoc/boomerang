import { boomerangReady, RULES } from './config.js';
import { throwWeapon } from './combat.js';

export function disarmPlayer(state, target, direction) {
  if (!boomerangReady(state)) return false;
  const count = state.projectiles.length;
  throwWeapon(state, target);
  if (state.projectiles.length === count) return false;
  const weapon = state.projectiles.at(-1);
  Object.assign(weapon, { mode: 'deflected', sharedPickup: true, returning: false,
    recalling: false, angle: direction, speed: RULES.kickDeflectSpeed, fallTime: 0 });
  return true;
}
