import { ellipse } from './shapes.js';
import { drawHeldBoomerang } from './held-boomerang.js';

export function handPoses(facing, stride, swing, strikeHand = 'right', strikeAim = facing) {
  return ['right', 'left'].map(hand => {
    const sign = hand === 'right' ? 1 : -1;
    const angle = facing + sign * Math.PI / 2;
    if (swing && hand === strikeHand) {
      const attackAngle = strikeAim + swing.angle;
      return { hand, x: Math.cos(attackAngle) * 37,
        y: Math.sin(attackAngle) * 29 - 5, angle: attackAngle, behind: false };
    }
    const x = Math.cos(angle) * 34 + Math.cos(facing) * stride * sign;
    const depth = Math.sin(angle) * 25 + Math.sin(facing) * stride * sign * 0.75;
    return { hand, x, y: depth - 8, angle: facing, behind: depth < -0.01 };
  });
}

export function drawHands(ctx, poses, character, weaponCount, behind) {
  for (const pose of poses) {
    if (pose.behind !== behind) continue;
    ellipse(ctx, pose.x, pose.y, 7, 7, behind ? character.dark : character.color);
    if (weaponCount > (pose.weaponSlot ?? (pose.hand === 'right' ? 0 : 1))) {
      drawHeldBoomerang(ctx, pose.x, pose.y, pose.angle, undefined, character.color);
    }
  }
}
