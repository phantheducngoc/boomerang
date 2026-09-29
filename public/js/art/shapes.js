export function rounded(ctx, x, y, w, h, radius, fill, stroke) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.stroke(); }
}

export function ellipse(ctx, x, y, rx, ry, color, angle = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}

export function line(ctx, points, color, width = 2) {
  ctx.beginPath();
  ctx.moveTo(...points[0]);
  points.slice(1).forEach(point => ctx.lineTo(...point));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

export function boomerang(ctx, x, y, angle = 0, scale = 1, color = '#f8d47d') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.beginPath();
  ctx.moveTo(-23, -12);
  ctx.quadraticCurveTo(-25, -19, -18, -16);
  ctx.lineTo(1, -3);
  ctx.lineTo(22, -17);
  ctx.quadraticCurveTo(28, -19, 26, -11);
  ctx.lineTo(7, 13);
  ctx.quadraticCurveTo(2, 18, -3, 11);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#a67546';
  ctx.lineWidth = 2;
  ctx.stroke();
  line(ctx, [[-17,-10],[-9,-4]], '#fff0bb', 3);
  line(ctx, [[15,-7],[19,-10]], '#fff0bb', 3);
  ctx.restore();
}
