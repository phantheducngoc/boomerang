import { createServer, connect } from 'node:net';

const port = Number(process.env.PORT || 3002);
const upstreamPort = Number(process.env.UPSTREAM_PORT || 3000);
const delay = Number(process.env.ONE_WAY_DELAY || 50);

function delayedPipe(source, target, timers) {
  source.on('data', data => {
    const timer = setTimeout(() => {
      timers.delete(timer);
      if (!target.destroyed) target.write(data);
    }, delay);
    timers.add(timer);
  });
}

const server = createServer(client => {
  const upstream = connect(upstreamPort, '127.0.0.1');
  const timers = new Set();
  delayedPipe(client, upstream, timers);
  delayedPipe(upstream, client, timers);
  const close = socket => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
    socket.destroy();
  };
  client.on('error', () => close(upstream));
  upstream.on('error', () => close(client));
  client.on('close', () => close(upstream));
  upstream.on('close', () => close(client));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Delay proxy → http://localhost:${port} (${delay}ms each way)`);
});

function shutdown() {
  server.close();
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
