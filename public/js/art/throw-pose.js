import { RULES } from '../../../shared/config.js';

function releaseTurn(progress, windup) {
  const followThrough = -Math.PI / 6;
  if (progress < 0.6) {
    const t = progress / 0.6;
    const ease = t * t * (3 - 2 * t);
    return windup + (followThrough - windup) * ease;
  }
  const t = Math.min(1, (progress - 0.6) / 0.4);
  return followThrough * (1 - t * t * (3 - 2 * t));
}

export function throwPose(player, weapons) {
  if (!player.alive || player.fallElapsed != null || player.strikeTime > 0) return null;
  if (player.throwPoseTime > 0) {
    const progress = Math.max(0, 1 - player.throwPoseTime / RULES.throwPoseTime);
    const reach = Math.sin(Math.PI * Math.min(1, progress / 0.7));
    return { releasing: true, aim: player.throwAim, lift: 24 * (1 - progress) ** 3,
      reach: 28 * reach, bodyTurn: releaseTurn(progress, player.throwBodyTurn ?? Math.PI / 2) };
  }
  if (weapons > 0 && player.input?.charging && !player.input?.dash) {
    const windup = Math.min(1, (player.throwChargeTime ?? 0) / 0.15);
    return { releasing: false, lift: 24 * windup, reach: -8 * windup,
      bodyTurn: Math.PI / 2 * windup };
  }
  return null;
}

export function poseThrowingHand(hands, pose, facing) {
  if (!pose) return;
  const hand = hands.find(item => item.hand === 'right');
  hand.x += Math.cos(facing) * pose.reach;
  hand.y += Math.sin(facing) * pose.reach * 0.75 - pose.lift;
  hand.angle = facing - pose.lift * 0.025;
  hand.behind = false;
  // The remaining weapon stays in the off hand during the throwing follow-through.
  if (pose.releasing) {
    hand.weaponSlot = 2;
    hands.find(item => item.hand === 'left').weaponSlot = 0;
  }
}
