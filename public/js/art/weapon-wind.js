// Local sprite coordinates: the renderer supplies the weapon height and camera scale.
export function drawWeaponWind(ctx, time) {
  ctx.save();
  const glow = ctx.createRadialGradient(0, 0, 5, 0, 0, 24);
  glow.addColorStop(0, 'rgba(255,255,255,0)');
  glow.addColorStop(0.65, 'rgba(255,255,255,0.25)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(-24, -24, 48, 48);
  ctx.rotate(time * 15);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur = 6;
  for (const [radius, width, alpha, offset] of [[19, 4, 0.55, 0], [22, 2, 0.3, 2.8]]) {
    ctx.globalAlpha *= alpha;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.arc(0, 0, radius, offset, offset + Math.PI * 1.35);
    ctx.stroke();
    ctx.globalAlpha /= alpha;
  }
  ctx.restore();
}
