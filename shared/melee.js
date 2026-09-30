import { boomerangReady, OBSTACLES, RULES, WORLD } from './config.js';
import { inStrikeArc } from './strike-geometry.js';
import { parryWeapon } from './parry.js';
import { movePlayer } from './physics.js';
import { disarmPlayer } from './disarm.js';
import { hasHeldWeapon, heldWeaponCount } from './weapon-inventory.js';
import { startStrikeMotion } from './strike-motion.js';

export function strike(state, player, defer = false) {
  if (!player.alive || player.fallElapsed != null) return;
  const canCombo = player.strikeComboAvailable && player.strikeComboTime > 0
    && heldWeaponCount(state, player) >= 2;
  if (player.strikeCooldown > 0 && !canCombo) return;
  if (canCombo && player.strikeTime > 0) {
    player.strikeComboQueued = true;
    return;
  }
  beginStrike(state, player, canCombo, defer);
}

export function updateStrikeCombo(state, player, dt) {
  player.strikeComboTime = Math.max(0, (player.strikeComboTime ?? 0) - dt);
  if (player.strikeComboTime <= 0) {
    player.strikeComboAvailable = false;
    player.strikeComboQueued = false;
  }
  if (!player.strikeComboQueued || player.strikeTime > 0) return;
  if (heldWeaponCount(state, player) < 2) {
    player.strikeComboAvailable = false;
    player.strikeComboQueued = false;
    return;
  }
  beginStrike(state, player, true, true);
}

function beginStrike(state, player, combo, defer) {
  player.strikeCooldown = RULES.strikeCooldown;
  player.strikeTime = RULES.strikeTime;
  player.strikeAim = player.aim;
  player.kickedTargets = [];
  player.clashedTargets = [];
  player.strikeKind = boomerangReady(state) && hasHeldWeapon(state, player)
    ? 'swing' : 'kick';
  player.strikeHand = combo ? 'left' : 'right';
  player.strikeComboAvailable = !combo && player.strikeKind === 'swing'
    && heldWeaponCount(state, player) >= 2;
  player.strikeComboTime = player.strikeComboAvailable ? RULES.dualStrikeWindow : 0;
  player.strikeComboQueued = false;
  startStrikeMotion(player);
  player.strikeRecoveryTime = player.strikeKind === 'swing'
    ? RULES.strikeTime + RULES.strikeRecovery : 0;
  if (!defer) resolveStrike(state, player);
}

export function resolveStrike(state, player) {
  if (!player.alive || player.fallElapsed != null || player.strikeTime <= 0) return;
  if (player.strikeKind === 'swing') breakCrates(state, player);
  for (const weapon of state.projectiles) parryWeapon(state, weapon, player);
  for (const target of state.players) {
    if (target.id === player.id || !target.alive || target.invincible || target.dashTime > 0
        || player.clashedTargets?.includes(target.id)
        || !inStrikeArc(player, target, player.strikeAim, WORLD.radius, state.brokenObstacles)) continue;
    if (player.strikeKind === 'kick') {
      player.kickedTargets ??= [];
      if (player.kickedTargets.includes(target.id)) continue;
      player.kickedTargets.push(target.id);
      state.events.push({ id: ++state.sequence, type: 'kick', x: target.x, y: target.y,
        angle: player.strikeAim, color: target.character, text: `${player.name} kicked ${target.name}` });
      movePlayer(target, Math.cos(player.strikeAim) * 40, Math.sin(player.strikeAim) * 40,
        1, state.players, undefined, state.brokenObstacles);
      disarmPlayer(state, target, player.strikeAim);
      continue;
    }
    target.alive = false;
    if (target.fallElapsed != null) { target.fallen = true; target.fallElapsed = null; }
    state.events.push({ id: ++state.sequence, x: target.x, y: target.y,
      color: target.character, text: `${player.name} struck ${target.name}` });
  }
}

export function resolveClashes(state) {
  for (let i=0;i<state.players.length;i++) {
    for (let j=i+1;j<state.players.length;j++) {
      const a=state.players[i], b=state.players[j];
      if (!canClash(state,a,b)) continue;
      const angle=Math.atan2(b.y-a.y,b.x-a.x);
      const force=430;
      Object.assign(a,{recoilX:-Math.cos(angle)*force,recoilY:-Math.sin(angle)*force});
      Object.assign(b,{recoilX:Math.cos(angle)*force,recoilY:Math.sin(angle)*force});
      a.clashedTargets ??= [];
      b.clashedTargets ??= [];
      a.clashedTargets.push(b.id);
      b.clashedTargets.push(a.id);
      state.events.push({id:++state.sequence,type:'clash',x:(a.x+b.x)/2,y:(a.y+b.y)/2,
        angle,color:a.character,text:`${a.name} and ${b.name} clashed!`});
    }
  }
}

function canClash(state, a, b) {
  if (!a.alive || !b.alive || a.strikeKind!=='swing' || b.strikeKind!=='swing'
      || a.strikeTime<=0 || b.strikeTime<=0
      || a.clashedTargets?.includes(b.id) || b.clashedTargets?.includes(a.id)
      || Math.abs(a.strikeTime-b.strikeTime)>0.08) return false;
  const middle={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  return inStrikeArc(a,middle,a.strikeAim,0,state.brokenObstacles)
    && inStrikeArc(b,middle,b.strikeAim,0,state.brokenObstacles);
}

function breakCrates(state, player) {
  state.brokenObstacles ??= [];
  OBSTACLES.forEach((box, index) => {
    if (box.kind !== 'crate' || state.brokenObstacles.includes(index)) return;
    const target = { x:box.x+box.w/2, y:box.y+box.h/2 };
    const radius = Math.hypot(box.w,box.h)/2;
    if (!inStrikeArc(player,target,player.strikeAim,radius,
      [...state.brokenObstacles,index])) return;
    state.brokenObstacles.push(index);
    state.events.push({ id:++state.sequence, type:'crate', x:target.x, y:target.y,
      color:player.character, text:`${player.name} smashed a crate!` });
  });
}
