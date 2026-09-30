import { HOLES, holeRadius } from '/shared/holes.js';
import { ellipse } from './shapes.js';

function rim(ctx, hole, inset = 0, drop = 0) {
  ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const angle = i / 120 * Math.PI * 2;
    const radius = holeRadius(hole, angle) - inset;
    const x = hole.x + Math.cos(angle) * radius;
    const y = hole.y + Math.sin(angle) * radius + drop;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

export function drawHoles(ctx) {
  for (const hole of HOLES) {
    const { x, y, radius } = hole;
    rim(ctx, hole, -5);
    ctx.fillStyle = '#8aa951';
    ctx.fill();
    ctx.save();
    rim(ctx, hole);
    ctx.clip();
    // Recessed stone walls descend to water, matching the shoreline fall effect.
    const wall = ctx.createLinearGradient(x, y - radius, x, y + radius);
    wall.addColorStop(0, '#26394d');
    wall.addColorStop(0.5, '#526278');
    wall.addColorStop(1, '#81908d');
    ctx.fillStyle = wall;
    ctx.fillRect(x - radius * 1.1, y - radius * 1.1, radius * 2.2, radius * 2.2);
    for (let i = 0; i < 9; i++) {
      const angle = Math.PI + i / 8 * Math.PI;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + 3, py + 13);
      ctx.lineTo(px - 2, py + 27);
      ctx.strokeStyle = '#182c3f55';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    const water = ctx.createLinearGradient(x, y - radius, x, y + radius);
    water.addColorStop(0, '#163747');
    water.addColorStop(1, '#4c8a8a');
    rim(ctx, hole, 5, 32);
    ctx.fillStyle = water;
    ctx.fill();
    ctx.strokeStyle = '#a7d9d455';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 25, 17, 6, 0, 0.2, 2.8);
    ctx.stroke();
    ctx.restore();
  }
}
