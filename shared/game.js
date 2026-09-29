import { boomerangReady, emptyInput, RULES, SPAWNS } from './config.js';
import { recallWeapon, retrieveWeapon } from './retrieval.js';
import { resolveClashes, resolveStrike, strike } from './melee.js';
import { movePlayer } from './physics.js';
import { throwWeapon, updateWeapons } from './combat.js';
import { bumpPlayers, updateRecoil } from './recoil.js';
import { resolveFalls } from './falls.js';

export function createPlayer(id, name, character, bot = false) {
  return { id, name, character, bot, weaponCount: 1, x: 0, y: 0, aim: 0, facing: Math.PI / 2, alive: true,
    strikeCooldown: 0, strikeTime: 0, strikeAim: 0, score: 0, dashTime: 0, dashCooldown: 0, dashX: 0, dashY: 0, input: emptyInput() };
}

export function createGame(players) {
  const state = { players, projectiles: [], brokenObstacles: [], events: [], sequence: 0,
    phase: 'countdown', remaining: 3, round: 0, winner: null, champion: null };
  beginRound(state);
  return state;
}

function beginRound(state) {
  state.round++;
  state.phase = 'countdown';
  state.remaining = 3;
  state.projectiles = [];
  state.brokenObstacles = [];
  state.winner = null;
  state.players.forEach((player, index) => {
    [player.x, player.y] = SPAWNS[index];
    player.alive = true;
    player.fallen = false;
    player.pickupCharges = 0;
    player.weaponCount = 1;
    player.recoilX = 0;
    player.recoilY = 0;
    player.bumpCooldown = 0;
    player.facing = Math.PI / 2;
    player.dashTime = 0;
    player.dashCooldown = 0;
    player.strikeCooldown = 0;
    player.strikeTime = 0;
    player.input = emptyInput();
  });
}

export function stepGame(state, dt) {
  if (state.phase === 'finished') return;
  state.events = [];
  state.remaining -= dt;
  if (state.phase === 'countdown') {
    if (state.remaining <= 0) {
      state.phase = 'playing';
      state.remaining = RULES.roundTime;
    }
    return;
  }
  if (state.phase === 'roundOver') {
    if (state.remaining <= 0) beginRound(state);
    return;
  }
  for (const player of state.players) {
    if (!player.alive) continue;
    player.strikeCooldown = Math.max(0, player.strikeCooldown - dt);
    player.strikeTime = Math.max(0, player.strikeTime - dt);
    const input = player.input;
    player.aim = input.aim;
    const charging = input.charging && !input.dash && !input.throw;
    if (charging) player.dashTime = 0;
    player.dashCooldown = Math.max(0, player.dashCooldown - dt);
    if (input.dash && player.dashCooldown <= 0) {
      const length = input.strike ? 0 : Math.hypot(input.x, input.y);
      player.dashX = length ? input.x / length : Math.cos(player.aim);
      player.dashY = length ? input.y / length : Math.sin(player.aim);
      player.dashTime = RULES.dashTime;
      player.dashCooldown = RULES.dashCooldown;
    }
    const length = Math.max(1, Math.hypot(input.x, input.y));
    const dashing = player.dashTime > 0;
    const directionX = dashing ? player.dashX : input.x;
    const directionY = dashing ? player.dashY : input.y;
    if (directionX || directionY) player.facing = Math.atan2(directionY, directionX);
    if (!charging) {
      movePlayer(player, dashing ? player.dashX * RULES.dashSpeed : input.x / length * RULES.speed,
        dashing ? player.dashY * RULES.dashSpeed : input.y / length * RULES.speed,
        dt, state.players, bumpPlayers, state.brokenObstacles);
    }
    player.dashTime = Math.max(0, player.dashTime - dt);
    const retrieved = retrieveWeapon(state, player);
    if (input.recall) recallWeapon(state, player);
    if (input.throw && boomerangReady(state)) throwWeapon(state, player, input.range);
    if (input.strike && (dashing || !(input.retrieve && retrieved))) strike(state, player, true);
    input.retrieve = false;
    input.strike = false;
    input.throw = false;
    input.dash = false;
  }
  updateRecoil(state.players, dt, state.brokenObstacles);
  resolveClashes(state);
  for (const player of state.players) resolveStrike(state, player);
  updateWeapons(state, dt);
  resolveFalls(state);
  const survivors = state.players.filter(player => player.alive);
  if (survivors.length <= 1 || state.remaining <= 0) {
    const winner = survivors.length === 1 ? survivors[0] : null;
    if (winner) winner.score++;
    state.winner = winner?.id ?? null;
    state.phase = winner?.score >= RULES.winScore ? 'finished' : 'roundOver';
    state.champion = state.phase === 'finished' ? winner.id : null;
    state.remaining = 3;
    state.projectiles = [];
  }
}
