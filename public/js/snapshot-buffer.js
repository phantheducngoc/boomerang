function mix(from, to, amount) {
  return from + (to - from) * amount;
}

function mixAngle(from, to, amount) {
  const turn = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + turn * amount;
}

function byId(items) {
  return new Map(items.map(item => [item.id, item]));
}

function interpolatePlayers(from, to, amount) {
  const previous = byId(from.players);
  return to.players.map(player => {
    const before = previous.get(player.id);
    if (!before) return { ...player, clientInterpolated: true };
    return {
      ...player,
      x: mix(before.x, player.x, amount),
      y: mix(before.y, player.y, amount),
      facing: mixAngle(before.facing ?? player.facing, player.facing, amount),
      aim: mixAngle(before.aim ?? player.aim, player.aim, amount),
      clientInterpolated: true
    };
  });
}

function interpolateProjectiles(from, to, amount) {
  const previous = byId(from.projectiles);
  return to.projectiles.map(weapon => {
    const before = previous.get(weapon.id);
    if (!before || before.mode !== weapon.mode) return { ...weapon };
    return {
      ...weapon,
      x: mix(before.x, weapon.x, amount),
      y: mix(before.y, weapon.y, amount),
      angle: mixAngle(before.angle, weapon.angle, amount)
    };
  });
}

export function interpolateState(from, to, amount) {
  const alpha = Math.max(0, Math.min(1, amount));
  return {
    ...to,
    players: interpolatePlayers(from, to, alpha),
    projectiles: interpolateProjectiles(from, to, alpha)
  };
}

export class SnapshotBuffer {
  constructor(delay = 90, limit = 12) {
    this.delay = delay;
    this.limit = limit;
    this.snapshots = [];
  }

  reset() {
    this.snapshots = [];
  }

  push(state, receivedAt) {
    this.snapshots.push({ state, receivedAt });
    if (this.snapshots.length > this.limit) this.snapshots.shift();
  }

  sample(now, delay = this.delay) {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) return this.snapshots[0].state;
    const target = now - delay;
    const afterIndex = this.snapshots.findIndex(snapshot => snapshot.receivedAt >= target);
    if (afterIndex < 0) return this.snapshots.at(-1).state;
    if (afterIndex === 0) return this.snapshots[0].state;
    const before = this.snapshots[afterIndex - 1];
    const after = this.snapshots[afterIndex];
    const span = Math.max(1, after.receivedAt - before.receivedAt);
    return interpolateState(before.state, after.state, (target - before.receivedAt) / span);
  }
}
