import { createServer } from 'node:http';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = normalize(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const configPath = join(root, 'src/demo-system/editor/conversation-overrides.json');
const port = Number(process.argv[2] || 4178);
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
};

function send(response, status, body, type = 'text/plain; charset=utf-8') {
  response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store' });
  response.end(body);
}

async function readBody(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (body.length > 1024 * 1024) throw new Error('Payload too large');
  }
  return body;
}

function validateConfig(value) {
  return value && typeof value === 'object'
    && value.instances && typeof value.instances === 'object' && !Array.isArray(value.instances)
    && value.tokens && typeof value.tokens === 'object' && !Array.isArray(value.tokens);
}

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host || '127.0.0.1'}`);
    if (request.method === 'POST' && url.pathname === '/__editor/conversation-overrides') {
      const config = JSON.parse(await readBody(request));
      if (!validateConfig(config)) return send(response, 400, 'Invalid editor config');
      const temporaryPath = `${configPath}.tmp`;
      await writeFile(temporaryPath, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
      await rename(temporaryPath, configPath);
      return send(response, 200, JSON.stringify({ ok: true }), 'application/json; charset=utf-8');
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') return send(response, 405, 'Method not allowed');
    const requested = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
    const filePath = normalize(join(root, requested));
    if (!filePath.startsWith(root)) return send(response, 403, 'Forbidden');
    const info = await stat(filePath);
    if (!info.isFile()) return send(response, 404, 'Not found');
    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
      'Content-Length': body.length,
      'Cache-Control': 'no-store',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch (error) {
    send(response, error?.code === 'ENOENT' ? 404 : 500, error?.message || 'Server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  process.stdout.write(`Conversation editor: http://127.0.0.1:${port}/index.html?view=conversation&edit=1\n`);
});
