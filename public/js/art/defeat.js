import { drawTurningFood, foodFaceOffset } from './food.js';
import { ellipse, line } from './shapes.js';

// Render in character-local coordinates; elapsed is seconds since defeat was first displayed.
// This is presentation only: elimination and hit detection remain in the game rules.
export function drawDefeat(ctx, character, elapsed) {
  // Clamp at the final pose so eliminated characters do not restart the animation.
  const progress = Math.min(1, Math.max(0, elapsed / 0.8));
  // A single recoil pulse settles halfway through the animation.
  const kick = Math.sin(Math.PI * Math.min(1, progress * 2));
  // Keep the cut above the eyes, accounting for each food's face placement.
  const faceY = -13 + foodFaceOffset(character.id);
  const cutY = Math.min(-25, faceY - 13);
  ellipse(ctx, 0, 14, 26, 9, '#354e3e24');
  ctx.save();
  // Fade late, retaining a faint lower half after the top disappears.
  ctx.globalAlpha *= 1 - Math.max(0, progress - 0.7) / 0.3 * 0.65;
  ctx.translate(kick * 7, progress * 7);
  ctx.rotate(kick * 0.16);
  // The lower half keeps the expression readable as the top pops off.
  ctx.save();
  ctx.beginPath();
  ctx.rect(-65, cutY, 130, 100);
  ctx.clip();
  drawTurningFood(ctx, character, Math.PI / 2);
  ctx.restore();
  // The exposed cut uses the character's accent color rather than injury detail.
  ellipse(ctx, 0, cutY + 1, 19, 4, character.accent);
  // Draw two crossed eyes and a short, flat mouth for the stunned expression.
  for (const x of [-9, 9]) {
    line(ctx, [[x - 3, faceY - 4], [x + 3, faceY + 2]], '#241e32', 2.8);
    line(ctx, [[x + 3, faceY - 4], [x - 3, faceY + 2]], '#241e32', 2.8);
  }
  line(ctx, [[-4, faceY + 8], [4, faceY + 8]], '#241e32', 2);
  ellipse(ctx, -28 - kick * 5, -5, 7, 7, character.dark);
  ellipse(ctx, 28 + kick * 5, -5, 7, 7, character.color);
  ellipse(ctx, -12, 13, 7, 7, character.dark);
  ellipse(ctx, 12, 13, 7, 7, character.dark);
  ctx.restore();
  ctx.save();
  // Clip a second copy to the upper half, then lift, tumble, and fade it independently.
  ctx.globalAlpha *= 1 - progress;
  ctx.translate(-progress * 18, -Math.sin(Math.PI * progress) * 32);
  ctx.rotate(-progress * 0.45);
  ctx.beginPath();
  ctx.rect(-65, -85, 130, cutY + 85);
  ctx.clip();
  drawTurningFood(ctx, character, Math.PI / 2);
  ctx.restore();
}
