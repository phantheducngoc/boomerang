export class WeaponTrails {
  constructor() {
    this.paths = new Map();
    this.duration = 0.4;
  }

  reset() { this.paths.clear(); }

  draw(ctx, weapons, time) {
    for (const weapon of weapons) {
      if (weapon.mode === 'grounded') continue;
      const deflected = weapon.mode === 'deflected';
      const height = deflected ? Math.max(0, 14 * (1 - weapon.fallTime / 0.4)) : 12;
      const path = this.paths.get(weapon.id) || { points: [], deflected };
      const last = path.points.at(-1);
      if (!last || Math.hypot(last.x - weapon.x, last.y - (weapon.y - height)) > 0.5) {
        path.points.push({ x: weapon.x, y: weapon.y - height, time });
      }
      path.deflected = deflected;
      this.paths.set(weapon.id, path);
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const [id, path] of this.paths) {
      path.points = path.points.filter(point => time - point.time < this.duration);
      if (!path.points.length) {
        this.paths.delete(id);
        continue;
      }
      const color = path.deflected ? '#d9dde3' : '#fff0b3';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      for (let i = 1; i < path.points.length; i++) {
        const from = path.points[i - 1];
        const to = path.points[i];
        const fade = Math.max(0, 1 - (time - from.time) / this.duration);
        for (const [width, opacity] of [[12, 0.18], [6, 0.45], [2.5, 0.9]]) {
          ctx.lineWidth = width * (0.35 + fade * 0.65);
          ctx.globalAlpha = fade * fade * opacity;
          ctx.strokeStyle = color;
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
        }
      }
    }
    ctx.restore();
  }
}
