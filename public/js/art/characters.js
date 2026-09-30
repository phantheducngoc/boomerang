import { CHARACTERS } from '/shared/config.js';
import { ellipse, line } from './shapes.js';
import { drawHeldBoomerang } from './held-boomerang.js';
import { drawFoodBody, foodFaceOffset } from './food.js';
import { strikePose } from './strike.js';
import { frontVisibility } from './turning.js';
import { keepSpriteUpright } from '../camera.js';

export function drawCharacter(ctx, player, time = 0, options = {}) {
  const character = CHARACTERS.find(item => item.id === player.character) || CHARACTERS[0];
  const size = options.scale || 1;
  const dual = Number(options.weapon) >= 2;
  const falling = player.fallElapsed != null;
  const swing = strikePose(player);
  const facing = falling ? Math.PI / 2 : swing ? player.strikeAim : options.facing ?? player.aim ?? player.facing ?? Math.PI / 2;
  const side = Math.cos(facing);
  const depth = Math.sin(facing);
  const front = frontVisibility(facing);
  const bob = options.still ? 0 : Math.sin(time * 3 + player.x * 0.02) * 2;
  ctx.save();
  ctx.translate(player.x, player.y);
  if (options.camera) keepSpriteUpright(ctx);
  ctx.scale(size, size);
  if (falling) {
    const drop = Math.max(0, Math.min(1, (player.fallElapsed - 0.5) / 0.2));
    ctx.translate(Math.sin(time * 55) * 2 * (1 - drop), drop * drop * 42);
    ctx.rotate((player.fallDriftX < 0 ? -1 : 1) * drop * 0.3);
    ctx.scale(1 - drop * 0.85, 1 - drop * 0.85);
    ctx.globalAlpha *= 1 - drop;
    ctx.fillStyle = '#fff9dc';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', 0, -64);
  }
  if (!player.alive) {
    ellipse(ctx, 0, 5, 20, 10, '#637c5420');
    ctx.globalAlpha = 0.3;
    line(ctx, [[-8,-5],[8,9]], character.dark, 5);
    line(ctx, [[8,-5],[-8,9]], character.dark, 5);
    ctx.restore();
    return;
  }
  if (!options.ghost) ellipse(ctx, 0, 14, 27, 10, '#354e3e24');
  if (options.mine) {
    ctx.beginPath();
    ctx.ellipse(0, 14, 34, 17, 0, 0, Math.PI * 2);
    ctx.strokeStyle = '#fcffed';
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.translate(0, bob);
  if (swing) {
    ctx.rotate(Math.cos(facing) * swing.punch * 0.012);
  }
  ellipse(ctx, -12 + side * 3, 11 - side * 3, 7, 10, character.dark, side * 0.3 - 0.25);
  ellipse(ctx, 13 + side * 3, 11 + side * 3, 7, 10, character.dark, side * 0.3 + 0.25);
  ellipse(ctx, -26, -7, 7, 12, character.dark, 0.3);
  ellipse(ctx, 26, -7, 7, 12, character.color, -0.5);
  ctx.save();
  ctx.scale(1 - Math.abs(side) * 0.22, 1);
  drawFoodBody(ctx, character, true);
  ctx.globalAlpha *= front;
  drawFoodBody(ctx, character, false);
  ctx.restore();
  ctx.save();
  ctx.translate(side * 17, depth * 5 + foodFaceOffset(character.id));
  ctx.scale(1 - Math.abs(side) * 0.4, 1);
  ctx.globalAlpha *= front;
  if (front > 0) {
    const look = side * 2;
    ellipse(ctx, -9 + look,-18,4.2,5.5,'#172c26');
    ellipse(ctx, 10 + look,-18,4.2,5.5,'#172c26');
    ellipse(ctx, -10 + look,-20,1.1,1.3,'#fffced');
    ellipse(ctx, 9 + look,-20,1.1,1.3,'#fffced');
    ellipse(ctx, -17,-10,5,2.7,'#e8897955');
    ellipse(ctx, 18,-10,5,2.7,'#e8897955');
    ctx.beginPath();
    if (falling) ctx.ellipse(1 + look, -9, 4, 6, 0, 0, Math.PI * 2);
    else ctx.arc(1 + look,-11,4,0.2,Math.PI - 0.2);
    ctx.strokeStyle = '#36503d';
    ctx.lineWidth = 1.6;
    ctx.stroke();
  }
  ctx.restore();
  if (swing && player.strikeKind === 'kick') {
    const reach = 23 + swing.punch * 3;
    const footX = Math.cos(facing) * reach;
    const footY = 8 + Math.sin(facing) * reach;
    line(ctx, [[Math.cos(facing) * 10, 8], [footX, footY]], character.dark, 10);
    ellipse(ctx, footX, footY, 13, 9, character.color, facing);
  }
  if (swing) {
    const angle = player.strikeAim + swing.angle;
    const handX = Math.cos(angle) * 37;
    const handY = Math.sin(angle) * 29 - 5;
    if (player.strikeKind !== 'kick') {
      line(ctx, [[side * 16, -8], [handX, handY]], character.dark, 7);
      ellipse(ctx, handX, handY, 8, 9, character.color, angle);
      if (options.weapon) drawHeldBoomerang(ctx, handX, handY, angle, 0.48);
    }
  } else {
    const handAngle = facing + (dual ? 0.65 : 0);
    const handX = Math.cos(handAngle) * 32;
    const handY = Math.sin(handAngle) * 25 - 8;
    line(ctx, [[side * 18, -8], [handX, handY]], character.dark, 7);
    ellipse(ctx, handX, handY, 7, 8, character.color, facing);
    if (options.weapon) drawHeldBoomerang(ctx, handX, handY, handAngle, 0.48);
  }
  if (dual) {
    const angle = swing && player.strikeHand === 'left' ? facing + 0.65 : facing - 0.85;
    const handX = Math.cos(angle) * 34;
    const handY = Math.sin(angle) * 27 - 8;
    line(ctx, [[side * 12, -9], [handX, handY]], character.dark, 7);
    ellipse(ctx, handX, handY, 7, 8, character.color, angle);
    drawHeldBoomerang(ctx, handX, handY, angle, 0.48);
  }
  ctx.restore();
  if (options.label) {
    ctx.save();
    ctx.translate(player.x, player.y);
    if (options.camera) keepSpriteUpright(ctx);
    ctx.font = '600 11px "Avenir Next", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#344f40';
    ctx.fillText(player.name, 0, -67 * size);
    ctx.restore();
  }
}
