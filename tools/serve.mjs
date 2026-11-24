// 《弹珠勇者》零依赖本地双栈静态资源服务器（支持中文路径解码、MP3 Range 分段传输与断连防崩）

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..');
const PORT = Number(process.argv[2] || process.env.PORT || 8890);
const HOST = process.env.HOST || '127.0.0.1';

process.stdout?.on?.('error', () => {});
process.stderr?.on?.('error', () => {});

const MIME_MAP = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.mp3': 'audio/mpeg',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  res.on('error', () => {});
  req.on('error', () => {});

  try {
    const urlObj = new URL(req.url || '/', `http://${req.headers.host || '127.0.0.1'}`);
    let decodedPath = decodeURIComponent(urlObj.pathname);
    if (decodedPath === '/') {
      res.writeHead(302, { Location: '/pinball/' });
      res.end();
      return;
    }

    let absPath = path.resolve(REPO_ROOT, '.' + decodedPath);
    if (!absPath.startsWith(REPO_ROOT)) {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Forbidden');
      return;
    }

    if (fs.existsSync(absPath) && fs.statSync(absPath).isDirectory()) {
      if (!decodedPath.endsWith('/')) {
        res.writeHead(302, { Location: decodedPath + '/' + urlObj.search });
        res.end();
        return;
      }
      absPath = path.join(absPath, 'index.html');
    }

    if (!fs.existsSync(absPath) || !fs.statSync(absPath).isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }

    const stat = fs.statSync(absPath);
    const ext = path.extname(absPath).toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';
    const range = req.headers.range;

    if (range && ext === '.mp3') {
      const m = /^bytes=(\d*)-(\d*)$/.exec(range);
      if (m) {
        const start = m[1] ? parseInt(m[1], 10) : 0;
        const end = m[2] ? Math.min(parseInt(m[2], 10), stat.size - 1) : stat.size - 1;
        if (start <= end && start < stat.size) {
          res.writeHead(206, {
            'Content-Type': contentType,
            'Content-Range': `bytes ${start}-${end}/${stat.size}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': end - start + 1,
            'Cache-Control': 'no-cache',
          });
          if (req.method === 'HEAD') {
            res.end();
            return;
          }
          const stream = fs.createReadStream(absPath, { start, end });
          stream.on('error', () => res.destroy());
          stream.pipe(res);
          return;
        }
      }
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
    });
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    const stream = fs.createReadStream(absPath);
    stream.on('error', () => res.destroy());
    stream.pipe(res);
  } catch {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal Server Error');
  }
});

server.on('error', (err) => {
  try {
    process.stderr.write(`Server error on ${HOST}:${PORT}: ${err.code || err.message}\n`);
  } catch {
    // ignore broken stdio pipe
  }
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  try {
    process.stdout.write(`Pinball Brave static server listening on http://${HOST}:${PORT}/pinball/\n`);
  } catch {
    // ignore broken stdio pipe
  }
});
