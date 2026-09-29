import { ellipse } from './shapes.js';

export class WaterSplashes {
  constructor() { this.splashes = []; }
  reset() { this.splashes = []; }
  add(event, time) { this.splashes.push({ ...event, born: time }); }

  draw(ctx, time) {
    this.splashes = this.splashes.filter(splash => time - splash.born < 0.8);
    for (const splash of this.splashes) {
      const age = time - splash.born;
      const progress = age / 0.8;
      const fade = 1 - progress;
      ctx.save();
      ctx.translate(splash.x, splash.y);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = '#d9ffff';
      ctx.lineWidth = 4 * fade + 1;
      ctx.beginPath();
      ctx.ellipse(0, 8, 15 + progress * 55, 6 + progress * 18, 0, 0, Math.PI * 2);
      ctx.stroke();
      for (let i = 0; i < 12; i++) {
        const angle = i / 12 * Math.PI * 2;
        const distance = 12 + progress * (35 + i % 3 * 8);
        const height = Math.sin(progress * Math.PI) * (28 + i % 4 * 5);
        ellipse(ctx, Math.cos(angle) * distance,
          Math.sin(angle) * distance * 0.35 - height, 4, 6, i % 2 ? '#bcecef' : '#f0ffff');
      }
      ctx.restore();
    }
  }
}
