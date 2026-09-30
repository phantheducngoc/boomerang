import { TREE_OBSTACLES } from './trees.js';

export const WORLD = { width: 1500, height: 990, radius: 20 };
export const RULES = { speed: 210, dashSpeed: 660, dashTime: 0.16,
  dashCooldown: 0.5, projectileSpeed: 510, returnAfter: 0.48,
  recallWindup: 0.2, recallStartSpeed: 35, recallAcceleration: 500, recallAccelerationGrowth: 450, recallMaxSpeed: 1100,
  minThrowSpeed: 300, maxThrowSpeed: 560, throwAcceleration: 650, throwPoseTime: 0.3,
  deflectSpeed: 310, kickDeflectSpeed: 390, deflectDrag: 800, pickupRadius: 32,
  minRange: 180, maxRange: 820, chargeTime: 0.9, strikeRange: 78,
  strikeHalfAngle: Math.PI / 3, strikeCooldown: 0.65, strikeTime: 0.2,
  dualStrikeWindow: 0.5, strikeLungeDistance: 45, strikeLungeTime: 0.09,
  roundTime: 60, boomerangDelay: 2, winScore: 5, maxPlayers: 6 };
export const boomerangReady = state => !Number.isFinite(state?.remaining)
  || (state.phase === 'playing' && RULES.roundTime - state.remaining >= RULES.boomerangDelay);
export const CHARACTERS = [
  { id: 'mint', name: 'Avocado', title: 'Smooth moves. Tough pit.', color: '#8eb957', dark: '#397346', accent: '#e9f5c4' },
  { id: 'peach', name: 'Watermelon', title: 'A slice of summer trouble.', color: '#f16c72', dark: '#39774b', accent: '#b5df83' },
  { id: 'lilac', name: 'Sushi', title: 'Small roll. Big energy.', color: '#49675a', dark: '#294a43', accent: '#edf0dc' },
  { id: 'gold', name: 'Banana', title: 'Ready to split the competition.', color: '#f4cd72', dark: '#b48640', accent: '#fff1b2' },
  { id: 'blue', name: 'Milk', title: 'Fresh from the fridge.', color: '#8cc6d8', dark: '#4e879f', accent: '#ddf4f4' },
  { id: 'rose', name: 'Donut', title: 'Sweet with a fighting streak.', color: '#df99b6', dark: '#a2587b', accent: '#ffe1ed' }
];
export const OBSTACLES = [
  { x: 270, y: 198, w: 105, h: 60 }, { x: 625, y: 402, w: 105, h: 60, kind: 'crate' },
  { x: 665, y: 177, w: 75, h: 78 }, { x: 260, y: 420, w: 75, h: 78 },
  { x: 455, y: 285, w: 90, h: 90, kind: 'crate' },
  { x: 880, y: 560, w: 105, h: 60 }, { x: 500, y: 660, w: 105, h: 60 },
  { x: 900, y: 360, w: 75, h: 78, kind: 'crate' }, { x: 820, y: 200, w: 75, h: 78 },
  { x: 780, y: 470, w: 90, h: 90 },
  ...TREE_OBSTACLES
];
export const SPAWNS = [
  [180, 170], [1000, 520], [760, 300], [480, 600], [750, 155], [640, 640]
];
export const emptyInput = () => ({ x: 0, y: 0, aim: 0, throw: false, recall: false, charging: false, dash: false, strike: false, retrieve: false, range: RULES.minRange });
