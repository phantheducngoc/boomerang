import { segmentDistance } from './physics.js';

export function hitPlayers(state, weapon, owner, previous) {
  if (weapon.mode !== 'flying') return;
  for (const target of state.players) {
    if (target.id === owner.id || !target.alive || target.invincible || target.dashTime > 0) continue;
    if (segmentDistance(target, previous, weapon) >= 26) continue;
    target.alive = false;
    state.events.push({ id: ++state.sequence, x: target.x, y: target.y,
      color: target.character, text: `${owner.name} tagged ${target.name}` });
  }
}
