import { ellipse } from './shapes.js';
import { stepGrass } from './grass-motion.js';

const PATCHES = [[390, 170], [1090, 300], [370, 580], [740, 760], [1170, 680]];
const OFFSETS = [[-18,-16],[8,-19],[30,-8],[-34,0],[-9,3],[17,7],[-17,23],[10,26]];

export class GrassPatches {
  constructor() { this.reset(); }

  reset() {
    this.lastTime = null;
    this.stems = PATCHES.flatMap(([x, y], patch) => OFFSETS.map(([dx, dy], index) => ({
      x: x + dx, y: y + dy, height: 38 + index % 3 * 5,
      phase: patch * 1.7 + index * 0.6, index,
      bendX: 0, bendY: 0, vx: 0, vy: 0
    }))).sort((a, b) => a.y - b.y);
  }

  update(players, time) {
    const dt = this.lastTime == null ? 0 : Math.max(0, time - this.lastTime);
    this.lastTime = time;
    for (const stem of this.stems) stepGrass(stem, players, dt);
  }

  drawShadows(ctx) {
    ctx.save();
    for (const stem of this.stems) {
      ellipse(ctx, stem.x + 13 + stem.bendX * 0.3, stem.y + 5, 18, 7, '#397b6430');
    }
    ctx.restore();
  }

  drawStem(ctx, stem, time) {
    ctx.save();
      const breeze = Math.sin(time * 1.8 + stem.phase) * 1.5;
      const x = stem.x + stem.bendX + breeze;
      const y = stem.y - stem.height + stem.bendY;
      ctx.beginPath();
      ctx.moveTo(stem.x, stem.y);
      ctx.quadraticCurveTo(stem.x + stem.bendX * 0.2, stem.y - stem.height * 0.6, x, y);
      ctx.strokeStyle = '#529b76';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.stroke();
      // Flattened six-sided leaves match the broad clustered tops in the reference.
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3;
        const px = x + Math.cos(angle) * 20;
        const py = y + Math.sin(angle) * 14;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = ['#79c79c', '#87cfa1', '#6db88b'][stem.index % 3];
      ctx.fill();
      ctx.strokeStyle = '#66ac8538';
      ctx.lineWidth = 1;
      ctx.stroke();
      if (stem.index % 3 === 0) ellipse(ctx, x - 3, y - 2, 3, 2.5, '#d9e9a9aa');
    ctx.restore();
  }
}
