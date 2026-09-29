import { RULES } from './config.js';
import { distance } from './physics.js';

import { recallStep } from './recall-slide.js';

export function updateRecall(weapon, owner, dt, broken = []) {
  if (!owner.input.recall) {
    Object.assign(weapon, { mode: 'grounded', recalling: false, recallWindup: 0, returning: false, blocked: false, speed: 0, pullTime: 0, slideTarget: null });
    return true;
  }
  if (weapon.recallWindup > 0) {
    const waiting = Math.min(dt, weapon.recallWindup);
    weapon.recallWindup -= waiting;
    dt -= waiting;
    if (dt <= 0) return true;
  }
  const length = distance(weapon, owner);
  if (length < 23) return false;
  weapon.angle = Math.atan2(owner.y - weapon.y, owner.x - weapon.x);
  const previousTime = weapon.pullTime || 0;
  weapon.pullTime = previousTime + dt;
  const pullSpeed = time => Math.min(RULES.recallMaxSpeed, RULES.recallStartSpeed
    + RULES.recallAcceleration * time + 0.5 * RULES.recallAccelerationGrowth * time * time);
  const nextSpeed = pullSpeed(weapon.pullTime);
  const travel = Math.min(length, (pullSpeed(previousTime) + nextSpeed) * 0.5 * dt);
  const next = recallStep(weapon, owner, travel, broken);
  if (!next) {
    Object.assign(weapon, { mode: 'grounded', blocked: true, speed: 0 });
    return true;
  }
  const { x, y } = next;
  Object.assign(weapon, { x, y, safeX: x, safeY: y, speed: nextSpeed, mode: 'flying', blocked: false });
  return distance(weapon, owner) >= 23;
}
