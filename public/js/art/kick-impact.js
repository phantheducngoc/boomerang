export class KickImpacts {
  constructor() { this.impacts = []; }
  reset() { this.impacts = []; }
  add(event, time) { this.impacts.push({ ...event, born: time }); }

  draw(ctx, time) {
    this.impacts = this.impacts.filter(hit => time - hit.born < 0.32);
    for (const hit of this.impacts) {
      const progress = (time - hit.born) / 0.32;
      const fade = 1 - progress;
      ctx.save();
      ctx.translate(hit.x, hit.y - 15);
      const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 58);
      glow.addColorStop(0, 'rgba(255,255,224,0.9)');
      glow.addColorStop(0.35, 'rgba(255,221,112,0.6)');
      glow.addColorStop(1, 'rgba(255,188,87,0)');
      ctx.globalAlpha = fade * fade;
      ctx.fillStyle = glow;
      ctx.fillRect(-58, -58, 116, 116);
      ctx.globalAlpha = fade * 0.85;
      ctx.strokeStyle = '#fff2c2';
      ctx.lineWidth = 3 * fade + 1;
      ctx.beginPath();
      ctx.arc(0, 0, 15 + Math.sqrt(progress) * 42, 0, Math.PI * 2);
      ctx.stroke();
      ctx.rotate(hit.angle || 0);
      ctx.fillStyle = '#fffddc';
      ctx.beginPath();
      for (let i = 0; i < 16; i++) {
        const angle = i * Math.PI / 8;
        const radius = (i % 2 ? 9 : 27) * fade;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.fill();
      ctx.lineCap = 'round';
      for (let i = 0; i < 9; i++) {
        const angle = i * Math.PI * 2 / 9 + 0.2;
        const radius = 20 + progress * (65 + i % 3 * 12);
        ctx.strokeStyle = i % 3 ? '#fff6c9' : '#ffd077';
        ctx.lineWidth = 2 + fade * 2;
        ctx.beginPath();
        ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        ctx.lineTo(Math.cos(angle) * (radius + 12 * fade), Math.sin(angle) * (radius + 12 * fade));
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}
