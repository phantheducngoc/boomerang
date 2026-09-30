import { emptyInput } from '../shared/config.js';

const QUEUE_LIMIT = 60;

export function pushInput(member, next) {
  const { sequence, ...input } = next;
  if (member.inputQueue.some(item => item.sequence === sequence)) return;
  member.inputQueue.push({ sequence, input });
  if (member.inputQueue.length > QUEUE_LIMIT) member.inputQueue.shift();
  member.lastInput = Date.now();
}

// One stored input drives one tick. A missing packet does not repeat the last move.
export function takeInput(member, now = Date.now()) {
  if (now - member.lastInput > 250) member.inputQueue.length = 0;
  const next = member.inputQueue.shift();
  if (!next) {
    member.player.input = emptyInput();
    return;
  }
  member.player.input = next.input;
  member.player.inputSequence = next.sequence;
}
