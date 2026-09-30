import { CHARACTERS, RULES } from '../shared/config.js';

export function profile(message) {
  const name = typeof message.name === 'string' ? message.name.trim().slice(0, 18) : '';
  const character = CHARACTERS.some(item => item.id === message.character) ? message.character : 'mint';
  return { name: name.replace(/[\x00-\x1f\x7f]/g, '') || 'Guest', character };
}

export function input(message) {
  if (![message.x, message.y, message.aim].every(Number.isFinite)) return null;
  const sequence = Number.isSafeInteger(message.sequence) && message.sequence >= 0 ? message.sequence : 0;
  return { x: Math.max(-1, Math.min(1, message.x)), y: Math.max(-1, Math.min(1, message.y)),
    aim: message.aim % (Math.PI * 2), throw: message.throw === true, dash: message.dash === true, strike: message.strike === true, retrieve: message.retrieve === true,
    recall: message.recall === true,
    charging: message.charging === true,
    range: Number.isFinite(message.range) ? Math.max(RULES.minRange, Math.min(RULES.maxRange, message.range)) : RULES.minRange,
    sequence };
}
