import { RULES } from '/shared/config.js';
import { strikeReach } from '/shared/strike-geometry.js';

export function strikePose(player) {
  if (!player.alive || !(player.strikeTime > 0)) return null;
  const progress = Math.max(0, Math.min(1, 1 - player.strikeTime / RULES.strikeTime));
  const sweep = 1 - (1 - progress) ** 3;
  return {
    progress,
    angle: -RULES.strikeHalfAngle + sweep * RULES.strikeHalfAngle * 2,
    punch: Math.sin(Math.PI * progress) * 8,
    opacity: Math.min(1, (1 - progress) * 2)
  };
}

export function drawStrike(ctx, player, broken = []) {
  const pose = strikePose(player);
  if (!pose) return;
  const radius = RULES.strikeRange;
  const tail = Math.max(-RULES.strikeHalfAngle, pose.angle - 1.25);
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.strikeAim);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (let i = 0; i <= 80; i++) {
    const angle = -RULES.strikeHalfAngle + i / 80 * RULES.strikeHalfAngle * 2;
    const reach = strikeReach(player, player.strikeAim + angle, undefined, broken);
    ctx.lineTo(Math.cos(angle) * reach, Math.sin(angle) * reach);
  }
  ctx.closePath();
  ctx.clip();
  if (player.strikeKind === 'kick') {
    ctx.globalAlpha = pose.opacity * 0.7;
    ctx.strokeStyle = '#fff4cb';
    ctx.lineWidth = 3;
    for (const offset of [-9, 9]) {
      ctx.beginPath();
      ctx.moveTo(22 + pose.punch, offset);
      ctx.lineTo(42 + pose.punch * 3, offset);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, -RULES.strikeHalfAngle, RULES.strikeHalfAngle);
  ctx.closePath();
  const rangeFade = ctx.createRadialGradient(0, 0, 12, 0, 0, radius);
  rangeFade.addColorStop(0, 'rgba(255,255,255,0)');
  rangeFade.addColorStop(0.35, 'rgba(255,255,255,0.12)');
  rangeFade.addColorStop(0.8, 'rgba(255,255,255,0.5)');
  rangeFade.addColorStop(1, 'rgba(255,255,255,0.18)');
  ctx.globalAlpha = pose.opacity;
  ctx.fillStyle = rangeFade;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, radius, -RULES.strikeHalfAngle, RULES.strikeHalfAngle);
  ctx.globalAlpha = pose.opacity * 0.8;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
  // The white fan fades toward the character and behind the moving edge.
  const segments = 16;
  for (let i = 0; i < segments; i++) {
    const start = tail + (pose.angle - tail) * i / segments;
    const end = tail + (pose.angle - tail) * (i + 1) / segments;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = rangeFade;
    ctx.globalAlpha = pose.opacity * (i + 1) / segments;
    ctx.fill();
  }
  ctx.shadowColor = 'rgba(255,255,255,0.7)';
  ctx.shadowBlur = 7;
  for (const [width, alpha] of [[16, 0.2], [8, 0.6], [3, 1]]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, tail, pose.angle);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = width;
    ctx.globalAlpha = pose.opacity * alpha;
    ctx.stroke();
  }
  ctx.globalAlpha = pose.opacity;
  ctx.translate(Math.cos(pose.angle) * radius, Math.sin(pose.angle) * radius);
  ctx.rotate(pose.angle);
  ctx.beginPath();
  ctx.moveTo(-7, 0);
  ctx.lineTo(0, -3);
  ctx.lineTo(8, 0);
  ctx.lineTo(0, 6);
  ctx.closePath();
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.restore();
}
