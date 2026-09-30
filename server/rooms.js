import { randomInt } from 'node:crypto';
import { createGame, createPlayer, stepGame } from '../shared/game.js';
import { RULES, emptyInput } from '../shared/config.js';
import { profile, input } from './validation.js';

export class RoomService {
  constructor(send) {
    this.send = send;
    this.rooms = new Map();
  }

  broadcast(room, message) {
    for (const member of room.members.values()) this.send(member.client, message);
  }

  lobby(room) {
    this.broadcast(room, { type: 'lobby', code: room.code, host: room.host,
      players: [...room.members.values()].map(member => member.player) });
  }

  leave(client) {
    const room = this.rooms.get(client.room);
    client.room = null;
    if (!room) return;
    room.members.delete(client.id);
    if (!room.members.size) { this.rooms.delete(room.code); return; }
    if (room.host === client.id) room.host = room.members.keys().next().value;
    if (room.game) {
      // Return everyone to the lobby rather than leave a match with a missing rival.
      room.game = null;
      this.broadcast(room, { type: 'notice', message: 'A player left. Back to the garden lobby.' });
    }
    this.lobby(room);
  }

  handle(client, message) {
    if (message.type === 'leave') { this.leave(client); return; }
    if (message.type === 'create' || message.type === 'join') {
      if (client.room) throw new Error('Leave your current room first.');
      let room;
      if (message.type === 'create') {
        if (this.rooms.size >= 200) throw new Error('The garden is full. Try again shortly.');
        let code;
        do { code = Array.from({ length: 5 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[randomInt(32)]).join(''); }
        while (this.rooms.has(code));
        room = { code, host: client.id, members: new Map(), game: null };
        this.rooms.set(code, room);
      } else {
        const code = typeof message.code === 'string' ? message.code.trim().toUpperCase() : '';
        room = this.rooms.get(code);
        if (!room) throw new Error('That room was not found. Check the code and try again.');
        if (room.game) throw new Error('This match has already started. Join after it ends.');
        if (room.members.size >= RULES.maxPlayers) throw new Error('This room is full (6 players).');
      }
      const details = profile(message);
      room.members.set(client.id, { client, lastInput: Date.now(), pendingInputSequence: 0,
        player: createPlayer(client.id, details.name, details.character) });
      client.room = room.code;
      this.lobby(room);
      return;
    }
    const room = this.rooms.get(client.room);
    if (!room) throw new Error('Join a room first.');
    if (message.type === 'start' || message.type === 'rematch') {
      if (room.host !== client.id) throw new Error('Only the room host can start the match.');
      if (room.members.size < 2) throw new Error('Invite at least one friend to start.');
      if (room.game && room.game.phase !== 'finished') throw new Error('A match is already running.');
      room.game = createGame([...room.members.values()].map(member => {
        member.player.score = 0;
        return member.player;
      }));
      this.broadcast(room, { type: 'state', state: room.game });
    } else if (message.type === 'input' && room.game) {
      const next = input(message);
      if (!next) return;
      const member = room.members.get(client.id);
      const { sequence, ...nextInput } = next;
      const previous = member.player.input;
      member.player.input = { ...nextInput, throw: previous.throw || nextInput.throw, dash: previous.dash || nextInput.dash,
        retrieve: previous.retrieve || nextInput.retrieve, strike: previous.strike || nextInput.strike,
        range: previous.throw ? previous.range : nextInput.range };
      member.pendingInputSequence = sequence;
      member.lastInput = Date.now();
    }
  }

  tick(dt) {
    for (const room of this.rooms.values()) {
      if (!room.game) continue;
      for (const member of room.members.values()) {
        if (Date.now() - member.lastInput > 250) member.player.input = emptyInput();
      }
      stepGame(room.game, dt);
      for (const member of room.members.values()) {
        member.player.inputSequence = member.pendingInputSequence;
      }
      this.broadcast(room, { type: 'state', state: room.game });
    }
  }
}
