import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.goto(process.env.TEST_URL || 'http://127.0.0.1:3000');
  const result = await page.evaluate(async () => {
    const { GameSession } = await import('/js/session.js');
    const { createGame, createPlayer } = await import('/shared/game.js');
    const { emptyInput } = await import('/shared/config.js');
    // Drive the real frame loop on a deterministic clock without scheduling another loop.
    const request = window.requestAnimationFrame;
    window.requestAnimationFrame = () => 0;
    try {
      const sent = [];
      const connection = { send: message => sent.push(message), latency: 50 };
      const session = new GameSession(connection, { play() {} });
      session.id = 'a';
      session.mode = 'online';
      session.state = createGame([createPlayer('a', 'A', 'mint'), createPlayer('b', 'B', 'peach')]);
      session.state.phase = 'playing';
      session.state.remaining = 50;
      let moving = true;
      session.input.read = () => ({ ...emptyInput(), x: moving ? 1 : 0 });
      session.input.previewRange = () => null;
      session.snapshots.sample = () => null;
      connection.interpolationDelay = () => 33;
      const originalX = session.state.players[0].x;
      for (let frame = 1; frame <= 60; frame++) session.frame(frame * 1000 / 60);
      const regular = sent.length;
      moving = false;
      session.frame(1500);
      const afterStall = sent.length;
      const lastX = sent.at(-1).x;
      // A newly received authoritative position should appear immediately.
      session.state.players[0].x += 20;
      session.frame(1517);
      return { regular, afterStall, lastX, originalX,
        authoritativeX: session.state.players[0].x,
        drawnX: session.renderer.positions.get('a').x };
    } finally { window.requestAnimationFrame = request; }
  });
  assert.equal(result.regular, 60);
  assert.equal(result.afterStall, 61);
  assert.equal(result.lastX, 0);
  assert.equal(result.authoritativeX, result.originalX + 20, 'input does not predict movement');
  assert.equal(result.drawnX, result.authoritativeX, 'local position has no render easing');
  console.log('Multiplayer timing: 60 inputs/sec, no catch-up burst, no prediction or local easing.');
} finally {
  await browser.close();
}
