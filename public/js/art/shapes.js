export const BOOMERANG_SCALE = 0.36;

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

function boomerangOutline(ctx) {
  ctx.beginPath();
  ctx.moveTo(-32, 10);
  ctx.bezierCurveTo(-34, 5, -29, -4, -18, -16);
  ctx.bezierCurveTo(-10, -25, -4, -27, 5, -23);
  ctx.bezierCurveTo(15, -19, 27, -11, 32, -5);
  ctx.bezierCurveTo(39, 4, 33, 13, 25, 10);
  ctx.bezierCurveTo(14, 5, 7, 1, 0, 1);
  ctx.bezierCurveTo(-9, 2, -17, 9, -23, 14);
  ctx.bezierCurveTo(-27, 17, -31, 15, -32, 10);
  ctx.closePath();
}

export function boomerang(ctx, x, y, angle = 0, scale = 1, color = '#f8d47d', breadth = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale * breadth, scale);
  // One continuous rounded elbow, with a deep inner bend and solid tips.
  boomerangOutline(ctx);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.save();
  ctx.clip();
  const shading = ctx.createLinearGradient(-14, -25, 10, 17);
  shading.addColorStop(0, '#ffffff40');
  shading.addColorStop(0.42, '#ffffff00');
  shading.addColorStop(1, '#170c4266');
  ctx.fillStyle = shading;
  ctx.fillRect(-40, -30, 80, 50);
  ctx.beginPath();
  ctx.moveTo(-29, 12);
  ctx.bezierCurveTo(-19, -3, -10, -10, 1, -10);
  ctx.bezierCurveTo(12, -10, 24, -3, 35, 5);
  ctx.lineTo(39, 20);
  ctx.lineTo(-35, 20);
  ctx.closePath();
  ctx.fillStyle = '#170c4255';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-25, -1);
  ctx.bezierCurveTo(-17, -13, -9, -23, 0, -22);
  ctx.strokeStyle = '#ffffff66';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();
  ctx.restore();
}
