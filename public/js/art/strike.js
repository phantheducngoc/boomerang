import { RULES } from '/shared/config.js';
import { strikeReach } from '/shared/strike-geometry.js';

export function strikePose(player) {
  if (!player.alive || !(player.strikeTime > 0)) return null;
  const progress = Math.max(0, Math.min(1, 1 - player.strikeTime / RULES.strikeTime));
  const sweep = 1 - (1 - progress) ** 3;
  const direction = player.strikeHand === 'left' ? -1 : 1;
  return {
    progress,
    direction,
    angle: direction * (-RULES.strikeHalfAngle + sweep * RULES.strikeHalfAngle * 2),
    punch: Math.sin(Math.PI * progress) * 8,
    opacity: Math.min(1, (1 - progress) * 2)
  };
}

export function drawStrike(ctx, player, broken = []) {
  const pose = strikePose(player);
  if (!pose) return;
  const radius = RULES.strikeRange;
  const tail = pose.direction > 0
    ? Math.max(-RULES.strikeHalfAngle, pose.angle - 1.25)
    : Math.min(RULES.strikeHalfAngle, pose.angle + 1.25);
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
  const rangeFade = ctx.createRadialGradient(0, 0, 20, 0, 0, radius);
  rangeFade.addColorStop(0, 'rgba(255,255,220,0)');
  rangeFade.addColorStop(0.62, 'rgba(255,255,220,0.08)');
  rangeFade.addColorStop(1, 'rgba(255,255,235,0.22)');
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, radius, -RULES.strikeHalfAngle, RULES.strikeHalfAngle);
  ctx.closePath();
  ctx.globalAlpha = pose.opacity;
  ctx.fillStyle = rangeFade;
  ctx.fill();
  // Layer tapered arc segments into the broad glowing crescent of the weapon swing.
  const segments = 18;
  ctx.shadowColor = 'rgba(255,255,205,0.9)';
  ctx.shadowBlur = 12;
  for (let i = 0; i < segments; i++) {
    const start = tail + (pose.angle - tail) * i / segments;
    const end = tail + (pose.angle - tail) * (i + 1) / segments;
    const position = (i + 0.5) / segments;
    const taper = Math.sin(Math.PI * position) ** 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 8 + position * 7, start, end, pose.direction < 0);
    ctx.strokeStyle = position > 0.72 ? '#fffef0' : '#fffbc2';
    ctx.lineWidth = 5 + taper * 25;
    ctx.globalAlpha = pose.opacity * (0.35 + position * 0.65);
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
