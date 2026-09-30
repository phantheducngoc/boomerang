import { CHARACTERS, RULES } from '../../../shared/config.js';

export function chargeArrowDistance(range) {
  const power = Math.max(0, Math.min(1, (range - RULES.minRange) / (RULES.maxRange - RULES.minRange)));
  return 50 + power * 90;
}

export function drawAimArrow(ctx, player, range) {
  if (!Number.isFinite(range) || !player.alive || player.fallElapsed != null) return;
  const directionX = Math.cos(player.aim);
  const directionY = Math.sin(player.aim);
  const distance = chargeArrowDistance(range);
  const color = CHARACTERS.find(item => item.id === player.character)?.color ?? '#d4b9ee';
  ctx.save();
  ctx.translate(player.x + directionX * distance, player.y + directionY * distance);
  ctx.rotate(player.aim);
  ctx.setLineDash([]);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.globalAlpha *= 0.9;
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-8, -11);
  ctx.lineTo(4, 0);
  ctx.lineTo(-8, 11);
  ctx.stroke();
  ctx.restore();
}
