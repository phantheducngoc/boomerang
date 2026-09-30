import { RULES } from '../../shared/config.js';
import { movePlayer } from '../../shared/physics.js';

export function predictMovement(player, input, dt, state) {
  player.strikeTime = Math.max(0, (player.strikeTime ?? 0) - dt);
  player.strikeRecoveryTime = Math.max(0, (player.strikeRecoveryTime ?? 0) - dt);
  const recovering = player.strikeTime <= 0 && player.strikeRecoveryTime > 0;
  if (recovering) player.dashTime = 0;
  player.dashCooldown = Math.max(0, (player.dashCooldown ?? 0) - dt);
  player.aim = input.aim;
  const charging = input.charging && !input.dash && !input.throw;
  if (charging) player.dashTime = 0;
  if (input.dash && player.dashCooldown <= 0 && !recovering) {
    const length = input.strike ? 0 : Math.hypot(input.x, input.y);
    player.dashX = length ? input.x / length : Math.cos(player.aim);
    player.dashY = length ? input.y / length : Math.sin(player.aim);
    player.dashTime = RULES.dashTime;
    player.dashCooldown = RULES.dashCooldown;
  }
  const length = Math.max(1, Math.hypot(input.x, input.y));
  const dashing = player.dashTime > 0;
  const directionX = dashing ? player.dashX : input.x;
  const directionY = dashing ? player.dashY : input.y;
  if (directionX || directionY) player.facing = Math.atan2(directionY, directionX);
  const previousX = player.x;
  const previousY = player.y;
  if (!charging && !recovering) {
    const speedX = dashing ? player.dashX * RULES.dashSpeed : input.x / length * RULES.speed;
    const speedY = dashing ? player.dashY * RULES.dashSpeed : input.y / length * RULES.speed;
    movePlayer(player, speedX, speedY, dt, state.players, undefined, state.brokenObstacles);
  }
  player.motionX = (player.x - previousX) / dt;
  player.motionY = (player.y - previousY) / dt;
  player.dashTime = Math.max(0, (player.dashTime ?? 0) - dt);
}

export class LocalPrediction {
  constructor(limit = 120) {
    this.limit = limit;
    this.history = [];
    this.player = null;
  }

  reset(player = null) {
    this.history = [];
    this.player = player ? { ...player } : null;
  }

  record(sequence, input, state, localId, dt = 1 / 30) {
    if (!this.player) {
      const local = state.players.find(player => player.id === localId);
      if (local) this.player = { ...local };
    }
    if (!this.player) return;
    this.history.push({ sequence, input: { ...input }, dt });
    if (this.history.length > this.limit) this.history.shift();
    predictMovement(this.player, input, dt, state);
  }

  reconcile(authoritative, state) {
    if (!authoritative || state.phase !== 'playing' || !authoritative.alive) {
      this.reset(authoritative);
      return;
    }
    const acknowledged = authoritative.inputSequence ?? 0;
    this.history = this.history.filter(entry => entry.sequence > acknowledged);
    this.player = { ...authoritative };
    for (const entry of this.history) {
      predictMovement(this.player, entry.input, entry.dt, state);
    }
  }

  apply(renderState, authoritativeState, localId) {
    if (!this.player) return renderState;
    const authoritative = authoritativeState.players.find(player => player.id === localId);
    return {
      ...renderState,
      players: renderState.players.map(player => player.id === localId ? {
        ...player,
        ...authoritative,
        x: this.player.x,
        y: this.player.y,
        facing: this.player.facing,
        motionX: this.player.motionX,
        motionY: this.player.motionY,
        dashTime: this.player.dashTime,
        clientPredicted: true
      } : player)
    };
  }
}
