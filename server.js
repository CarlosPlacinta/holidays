/* Tiny local web server for the Holidays app (no dependencies).

     node server.js          → http://localhost:5173 (this PC only)
     node server.js --lan    → also reachable from phones on the same Wi-Fi

   It only serves the app's own files. Your trips never pass through it:
   they are stored inside the browser on each device. */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5173;
const LAN = process.argv.includes('--lan');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};
const PUBLIC = new Set(['index.html', 'sw.js', 'manifest.webmanifest']);
const PUBLIC_DIRS = ['css', 'js', 'icons'];

const server = http.createServer((req, res) => {
  const send = (code, body, type = 'text/plain; charset=utf-8') => {
    res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    res.end(body);
  };
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(405, 'Method not allowed');

  let rel;
  try {
    rel = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).replace(/^\/+/, '');
  } catch {
    return send(400, 'Bad request');
  }
  if (rel === '') rel = 'index.html';

  const parts = rel.split('/');
  const allowed = parts.every((p) => p && !p.startsWith('.')) &&
    (PUBLIC.has(rel) || (parts.length === 2 && PUBLIC_DIRS.includes(parts[0])));
  const file = path.join(ROOT, ...parts);
  if (!allowed || !file.startsWith(ROOT + path.sep)) return send(404, 'Not found');

  fs.readFile(file, (err, data) => {
    if (err) return send(404, 'Not found');
    send(200, req.method === 'HEAD' ? '' : data, TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream');
  });
});

server.listen(PORT, LAN ? '0.0.0.0' : '127.0.0.1', () => {
  console.log(`Holidays is running at http://localhost:${PORT}`);
  if (LAN) {
    for (const list of Object.values(os.networkInterfaces())) {
      for (const net of list || []) {
        if (net.family === 'IPv4' && !net.internal) console.log(`On your phone (same Wi-Fi): http://${net.address}:${PORT}`);
      }
    }
  }
});
