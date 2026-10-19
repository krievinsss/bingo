import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv.includes('--dist') ? 'dist' : '.');
const port = Number(process.env.PORT || 5173);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml' };
createServer(async (req, res) => {
  try {
    const path = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    const target = resolve(root, `.${path === '/' ? '/index.html' : path}`);
    if (!(target === root || target.startsWith(root + sep))) throw Error('Forbidden');
    if (!(await stat(target)).isFile()) throw Error('Not a file');
    const content = await readFile(target);
    res.writeHead(200, { 'content-type': types[extname(target)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
}).listen(port, '0.0.0.0', () => console.log(`BINGO: http://localhost:${port}`));
