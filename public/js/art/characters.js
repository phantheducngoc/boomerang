import { CHARACTERS, RULES } from '/shared/config.js';
import { ellipse, line } from './shapes.js';
import { handPoses, drawHands } from './hands.js';
import { drawTurningFood, foodFaceOffset, foodThickness } from './food.js';
import { strikePose } from './strike.js';
import { frontVisibility, bodyProjection } from './turning.js';
import { keepSpriteUpright } from '../camera.js';
import { throwPose, poseThrowingHand } from './throw-pose.js';
import { drawDefeat } from './defeat.js';

export function drawCharacter(ctx, player, time = 0, options = {}) {
  const character = CHARACTERS.find(item => item.id === player.character) || CHARACTERS[0];
  const size = (options.scale || 1) * 0.8;
  const falling = player.fallElapsed != null;
  const swing = strikePose(player);
  const throwing = throwPose(player, Number(options.weapon) || 0);
  const aimFacing = falling ? Math.PI / 2 : swing ? player.strikeAim : throwing?.releasing
    ? throwing.aim : options.facing ?? player.aim ?? player.facing ?? Math.PI / 2;
  const facing = aimFacing + (throwing?.bodyTurn ?? 0) + (swing?.bodyTurn ?? 0);
  const side = Math.cos(facing);
  const depth = Math.sin(facing);
  const front = frontVisibility(facing);
  const bob = options.still ? 0 : Math.sin(time * 3 + player.x * 0.02) * 2;
  const speed = Math.hypot(player.motionX ?? 0, player.motionY ?? 0);
  const stride = options.still || falling || swing || throwing || !player.alive ? 0
    : Math.sin(time * 14) * Math.min(1.5, speed / RULES.speed) * 7;
  const hands = handPoses(facing, stride, player.strikeKind === 'kick' ? null : swing, player.strikeHand, aimFacing);
  poseThrowingHand(hands, throwing, aimFacing);
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
    // Replace the normal body and face with the cut animation. Callers without a
    // render timestamp get the settled pose rather than repeatedly showing impact.
    drawDefeat(ctx, character, options.defeatElapsed ?? 0.8);
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
  if (swing && player.strikeKind === 'kick') {
    ctx.rotate(Math.cos(facing) * swing.punch * 0.012);
  }
  const kicking = swing && player.strikeKind === 'kick';
  ellipse(ctx, -12 + side * 3, 11 - side * 3, 7, 7, character.dark);
  if (!kicking) ellipse(ctx, 13 + side * 3, 11 + side * 3, 7, 7, character.dark);
  // Rock the body around its base in rhythm with the hands, leaving feet planted.
  ctx.translate(0, 11);
  ctx.rotate(stride * 0.012);
  ctx.translate(0, -11);
  drawHands(ctx, hands, character, Number(options.weapon) || 0, true);
  drawTurningFood(ctx, character, facing);
  ctx.save();
  const profile = bodyProjection(facing, foodThickness(character.id));
  if (character.id === 'lilac') profile.faceX = side * 23;
  ctx.translate(profile.faceX, depth * 5 + foodFaceOffset(character.id));
  ctx.scale(Math.max(0.001, profile.width), 1);
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
    ellipse(ctx, footX, footY, 8, 8, character.color);
  }
  drawHands(ctx, hands, character, Number(options.weapon) || 0, false);
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
