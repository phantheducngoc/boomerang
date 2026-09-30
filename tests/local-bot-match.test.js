import test from 'node:test';
import assert from 'node:assert/strict';
import { localBotMatch } from '../public/js/local-bot-match.js';

test('a room of one human and bots plays locally', () => {
  const bots = [
    { id: 'bot1', bot: true },
    { id: 'bot2', bot: true },
    { id: 'bot3', bot: true },
    { id: 'bot4', bot: true },
    { id: 'bot5', bot: true }
  ];
  assert.equal(localBotMatch([{ id: 'host' }, ...bots], 'host'), true);
  assert.equal(localBotMatch([{ id: 'host' }, { id: 'guest' }, ...bots], 'host'), false);
  assert.equal(localBotMatch(bots, 'host'), false);
});
