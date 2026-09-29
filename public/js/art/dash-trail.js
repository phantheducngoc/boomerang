import { drawCharacter } from './characters.js';

export class DashTrails {
  constructor() {
    this.samples = [];
    this.last = new Map();
    this.duration = 0.24;
  }

  reset() {
    this.samples = [];
    this.last.clear();
  }

  draw(ctx, players, time) {
    for (const player of players) {
      if (!player.alive || player.dashTime <= 0) {
        this.last.delete(player.id);
        continue;
      }
      const last = this.last.get(player.id);
      if (last && Math.hypot(player.x - last.x, player.y - last.y) < 9) continue;
      const pose = { ...player, dashTime: 0, strikeTime: 0 };
      this.samples.push({ player: pose, born: time });
      this.last.set(player.id, pose);
    }
    this.samples = this.samples.filter(sample => time - sample.born < this.duration);
    ctx.save();
    for (const sample of this.samples) {
      const fade = 1 - (time - sample.born) / this.duration;
      ctx.globalAlpha = 0.3 * fade * fade;
      drawCharacter(ctx, sample.player, 0, { still: true, ghost: true });
    }
    ctx.restore();
  }
}
