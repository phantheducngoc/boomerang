import { RULES } from './config.js';
import { clamp, collides, distance, hitsObstacle, segmentDistance } from './physics.js';
import { parryWeapon, updateDropped } from './parry.js';
import { returnAngle, throwAngle } from './throw-path.js';
import { updateRecall } from './recall-physics.js';
import { hitPlayers } from './projectile-hits.js';
import { hasHeldWeapon } from './weapon-inventory.js';

export function throwWeapon(state, player, range = RULES.projectileSpeed * RULES.returnAfter) {
  if (!hasHeldWeapon(state, player)) return;
  player.throwPoseTime = RULES.throwPoseTime;
  player.throwAim = player.aim;
  player.throwBodyTurn = Math.PI / 2 * Math.min(1, (player.throwChargeTime ?? 0) / 0.15);
  if (player.pickupCharges > 0) player.pickupCharges--;
  range = clamp(Number.isFinite(range) ? range : RULES.minRange, RULES.minRange, RULES.maxRange);
  const power = (range - RULES.minRange) / (RULES.maxRange - RULES.minRange);
  const speed = RULES.minThrowSpeed + (RULES.maxThrowSpeed - RULES.minThrowSpeed) * power;
  state.projectiles.push({ id: ++state.sequence, owner: player.id,
    x: player.x, y: player.y, safeX: player.x, safeY: player.y,
    angle: player.aim, launchAim: player.aim, age: 0, returning: false, mode: 'flying', sharedPickup: false,
    range, traveled: 0, power, speed, maxSpeed: speed + 60 + 100 * power });
}

function updateFlight(state, weapon, owner, dt) {
  if (!weapon.returning && weapon.traveled >= weapon.range) {
    weapon.returning = true;
    weapon.loopReturn = true;
  }
  if (weapon.returning) weapon.angle = returnAngle(weapon, owner, dt);
  const previous = { x: weapon.x, y: weapon.y };
  const nextSpeed = Math.min(weapon.maxSpeed, weapon.speed + RULES.throwAcceleration * (1 + weapon.power) * dt);
  const travel = Math.min((weapon.speed + nextSpeed) / 2 * dt,
    weapon.returning ? Infinity : weapon.range - weapon.traveled);
  if (!weapon.returning) weapon.angle = throwAngle(weapon.launchAim ?? weapon.angle, weapon.power,
    (weapon.traveled + travel / 2) / weapon.range);
  weapon.speed = nextSpeed;
  weapon.x += Math.cos(weapon.angle) * travel;
  weapon.y += Math.sin(weapon.angle) * travel;
  weapon.traveled += travel;
  if (distance(weapon, owner) > 48) weapon.departed = true;
  if (weapon.returning && hitsObstacle(weapon.x, weapon.y, 8, state.brokenObstacles)) {
    weapon.x = weapon.safeX;
    weapon.y = weapon.safeY;
    weapon.mode = 'grounded';
    weapon.sharedPickup = false;
    weapon.speed = 0;
    weapon.returning = false;
    return true;
  }
  if (!weapon.returning && hitsObstacle(weapon.x, weapon.y, 8, state.brokenObstacles)) {
    weapon.x = previous.x;
    weapon.y = previous.y;
    weapon.returning = true;
    weapon.loopReturn = false;
  }
  if (!collides(weapon.x, weapon.y, 20, state.brokenObstacles)) {
    weapon.safeX = weapon.x; weapon.safeY = weapon.y;
  }
  // Small simulation steps let a swing intercept fast throws before body hits.
  for (const player of state.players) {
    if (parryWeapon(state, weapon, player, previous)) return true;
  }
  hitPlayers(state, weapon, owner, previous);
  if (weapon.returning && segmentDistance(owner, previous, weapon) < 23) {
    // A bounce off nearby cover has not flown yet, so leave it on the ground to pick up.
    if (!weapon.departed) {
      weapon.x = weapon.safeX;
      weapon.y = weapon.safeY;
      weapon.mode = 'grounded';
      weapon.sharedPickup = false;
      weapon.speed = 0;
      weapon.returning = false;
      return true;
    }
    return false;
  }
  return weapon.age < 8;
}

export function updateWeapons(state, dt) {
  const steps = Math.max(1, Math.ceil(dt / (1 / 180)));
  state.projectiles = state.projectiles.filter(weapon => {
    const owner = state.players.find(player => player.id === weapon.owner);
    if (!owner || !owner.alive) return false;
    for (let step = 0; step < steps; step++) {
      weapon.age += dt / steps;
      const wasRecalling = weapon.recalling;
      const previous = { x: weapon.x, y: weapon.y };
      const keep = weapon.recalling
        ? updateRecall(weapon, owner, dt / steps, state.brokenObstacles) : weapon.mode === 'flying'
        ? updateFlight(state, weapon, owner, dt / steps)
        : updateDropped(weapon, dt / steps, state.brokenObstacles);
      if (wasRecalling) {
        for (const player of state.players) {
          if (parryWeapon(state, weapon, player, previous)) break;
        }
        hitPlayers(state, weapon, owner, previous);
      }
      if (weapon.mode === 'deflected' && wasRecalling) continue;
      if (!keep) return false;
    }
    return true;
  });
}
