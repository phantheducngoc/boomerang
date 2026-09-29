import { emptyInput, RULES } from './config.js';
import { distance, terrainBlocked } from './physics.js';
import { BOT_LEVELS, botLevel } from './bot-levels.js';

export function updateBots(state, time) {
  for (const bot of state.players.filter(player => player.bot && player.alive)) {
    const level = BOT_LEVELS[botLevel(bot.difficulty)];
    const dropped = state.projectiles.find(weapon => weapon.owner === bot.id && weapon.mode === 'grounded');
    if (dropped && !level.recall) {
      const angle = Math.atan2(dropped.y-bot.y,dropped.x-bot.x);
      let move = angle;
      if (terrainBlocked(bot.x+Math.cos(move)*40,bot.y+Math.sin(move)*40,undefined,state.brokenObstacles)) move += Math.PI/2;
      bot.input = { ...emptyInput(), x:Math.cos(move)*level.speed, y:Math.sin(move)*level.speed, aim:angle, retrieve:true };
      continue;
    }
    const enemies = state.players.filter(player => player.id !== bot.id && player.alive);
    const target = enemies.sort((a, b) => distance(bot, a) - distance(bot, b))[0];
    if (!target) { bot.input = emptyInput(); continue; }
    const aim = Math.atan2(target.y - bot.y, target.x - bot.x);
    const offset = Number(bot.id.replace(/\D/g, '')) || 1;
    const strafe = Math.sin(time * 0.8 + offset) > 0 ? 1 : -1;
    const moveAngle = aim + (distance(bot, target) < 200 ? Math.PI / 2 * strafe : 0.4 * strafe);
    let x = Math.cos(moveAngle);
    let y = Math.sin(moveAngle);
    if (terrainBlocked(bot.x + x * 45, bot.y + y * 45,undefined,state.brokenObstacles)) {
      x = Math.cos(moveAngle + Math.PI / 2);
      y = Math.sin(moveAngle + Math.PI / 2);
    }
    const danger = state.projectiles.some(weapon => weapon.owner !== bot.id && weapon.mode === 'flying'
      && distance(bot, weapon) < level.dangerRadius);
    bot.input = { ...emptyInput(), x:x*level.speed, y:y*level.speed, aim: aim + Math.sin(time * 2 + offset) * level.aimError,
      strike: distance(bot, target) < RULES.strikeRange || danger,
      range: Math.max(RULES.minRange, Math.min(RULES.maxRange, distance(bot, target) + 25)),
      throw: Math.sin(time * level.attackRate + offset * 2) > 0.96, dash: danger && level.dodge,
      recall: Boolean(dropped && level.recall) };
  }
}
