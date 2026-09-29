import { collides } from '/shared/physics.js';

export function drawAimArrow(ctx, player, range) {
  if (range === null || !player.alive) return;
  const directionX = Math.cos(player.aim);
  const directionY = Math.sin(player.aim);
  const points = [];
  for (let distance = 0; distance <= 48; distance += 2) {
    const x = player.x + directionX * distance;
    const y = player.y + directionY * distance;
    if (collides(x, y, 8)) break;
    if (distance >= 36) points.push([x, y]);
  }
  if (points.length < 2) return;
  ctx.save();
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(255,242,178,0.85)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  ctx.lineTo(...points.at(-1));
  ctx.stroke();
  ctx.restore();
}
