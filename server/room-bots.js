import { CHARACTERS, RULES } from '../shared/config.js';
import { createPlayer } from '../shared/game.js';
import { botLevel } from '../shared/bot-levels.js';

export function seatCount(room) {
  return room.members.size + room.bots.length;
}

export function addBot(room, difficulty) {
  if (room.game) throw new Error('Add bots before the match starts.');
  if (seatCount(room) >= RULES.maxPlayers) throw new Error('This room is full (6 players).');
  const taken = new Set([
    ...[...room.members.values()].map(member => member.player.character),
    ...room.bots.map(bot => bot.character)
  ]);
  const character = CHARACTERS.find(item => !taken.has(item.id)) || CHARACTERS[room.bots.length % CHARACTERS.length];
  const player = createPlayer(`bot${room.nextBot}`, character.name, character.id, true);
  room.nextBot += 1;
  player.difficulty = botLevel(difficulty);
  room.bots.push(player);
}

export function removeBot(room, id) {
  if (room.game) throw new Error('Remove bots before the match starts.');
  const index = room.bots.findIndex(bot => bot.id === id);
  if (index < 0) throw new Error('That bot is not in this room.');
  room.bots.splice(index, 1);
}
