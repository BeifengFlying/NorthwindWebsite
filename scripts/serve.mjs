import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicRoot = path.join(projectRoot, 'dist');
const portFlag = process.argv.indexOf('--port');
const requestedPort = portFlag >= 0 ? Number(process.argv[portFlag + 1]) : 4173;
const port = Number.isInteger(requestedPort) ? requestedPort : 4173;
const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.wav': 'audio/wav',
  '.webp': 'image/webp',
};

function resolveRequestPath(url = '/') {
  const pathname = decodeURIComponent(new URL(url, 'http://localhost').pathname);
  const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const resolved = path.resolve(publicRoot, relativePath);
  return resolved.startsWith(`${publicRoot}${path.sep}`) ? resolved : null;
}

const server = createServer(async (request, response) => {
  let filePath = resolveRequestPath(request.url);
  try {
    if (!filePath || !(await stat(filePath)).isFile()) throw new Error('Not found');
  } catch {
    filePath = path.join(publicRoot, '404.html');
    response.statusCode = 404;
  }

  const extension = path.extname(filePath).toLowerCase();
  response.setHeader('Content-Type', contentTypes[extension] || 'application/octet-stream');
  response.setHeader('Cache-Control', 'no-cache');
  createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Northwind preview: http://127.0.0.1:${port}`);
});
