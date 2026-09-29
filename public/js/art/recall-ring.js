export function drawRecallRing(ctx, weapon, time, height) {
  if (!weapon.recalling || weapon.recallWindup > 0) return;
  ctx.save();
  ctx.translate(weapon.x, weapon.y - height);
  const radius = 20 + Math.sin(time * 9) * 2;
  ctx.strokeStyle = '#fff9dc';
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.95;
  ctx.rotate(time * 5);
  for (const angle of [0, Math.PI]) {
    ctx.beginPath();
    ctx.arc(0, 0, radius, angle, angle + 1.1);
    ctx.stroke();
  }
  ctx.restore();
}
