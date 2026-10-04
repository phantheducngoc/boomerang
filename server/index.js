import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { serve } from './http.js';
import { RoomService } from './rooms.js';
import { NETWORK_TICK_SECONDS } from '../shared/network-timing.js';

const server = createServer(serve);
const sockets = new WebSocketServer({ noServer: true, maxPayload: 2048 });
const send = (client, message) => {
  if (client.socket.readyState === 1 && client.socket.bufferedAmount < 100000) {
    client.socket.send(JSON.stringify(message));
  }
};
const rooms = new RoomService(send);

server.on('upgrade', (req, socket, head) => {
  let allowed = req.url === '/ws' && sockets.clients.size < 1200;
  try {
    if (req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) allowed = false;
  } catch { allowed = false; }
  if (!allowed) { socket.destroy(); return; }
  sockets.handleUpgrade(req, socket, head, ws => sockets.emit('connection', ws));
});

sockets.on('connection', socket => {
  const client = { id: randomUUID(), socket, room: null };
  let count = 0;
  let windowStart = Date.now();
  let alive = true;
  send(client, { type: 'welcome', id: client.id });
  socket.on('pong', () => { alive = true; });
  const heartbeat = setInterval(() => {
    if (!alive) { socket.terminate(); return; }
    alive = false;
    socket.ping();
  }, 15000);
  socket.on('message', raw => {
    if (Date.now() - windowStart > 1000) { count = 0; windowStart = Date.now(); }
    if (++count > 100) { socket.close(1008, 'Too many messages'); return; }
    try {
      const message = JSON.parse(raw.toString());
      if (!message || typeof message !== 'object') return;
      if (message.type === 'ping') { send(client, { type: 'pong', at: message.at }); return; }
      rooms.handle(client, message);
    } catch (error) {
      send(client, { type: 'error', message: error instanceof SyntaxError ? 'Invalid message.' : error.message });
    }
  });
  socket.on('error', () => socket.terminate());
  socket.on('close', () => { clearInterval(heartbeat); rooms.leave(client); });
});

const timer = setInterval(() => rooms.tick(NETWORK_TICK_SECONDS), NETWORK_TICK_SECONDS * 1000);
const port = Number(process.env.PORT || 3000);
server.listen(port, '0.0.0.0', () => console.log(`Boomerang Arena → http://localhost:${port}`));
function shutdown() {
  clearInterval(timer);
  for (const socket of sockets.clients) socket.terminate();
  sockets.close();
  server.close();
}
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
