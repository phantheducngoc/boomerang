import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

export async function serve(req, res) {
  try {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405).end();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' }).end('{"ok":true}');
      return;
    }
    const pathname = decodeURIComponent(url.pathname);
    const shared = pathname.startsWith('/shared/');
    const base = resolve(root, shared ? 'shared' : 'public');
    const relative = shared ? pathname.slice(8) : pathname === '/' ? 'index.html' : pathname.slice(1);
    const target = resolve(base, relative);
    if (!target.startsWith(base + sep) || !types[extname(target)]) {
      res.writeHead(404).end('Not found');
      return;
    }
    const content = await readFile(target);
    res.writeHead(200, { 'Content-Type': `${types[extname(target)]}; charset=utf-8`,
      'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'no-cache',
      'Content-Security-Policy': "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'" });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    res.writeHead(404).end('Not found');
  }
}
