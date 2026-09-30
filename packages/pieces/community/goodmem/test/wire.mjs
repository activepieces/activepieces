import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { createMockActionContext } from '@activepieces/pieces-framework';
import {
  goodmem as sourcePiece,
  goodmemAuth as sourceAuth,
} from '../src/index.ts';

const pieceModule = process.env['GOODMEM_TEST_BUNDLE']
  ? createRequire(import.meta.url)(process.env['GOODMEM_TEST_BUNDLE'])
  : { goodmem: sourcePiece, goodmemAuth: sourceAuth };
export const goodmemAuth = pieceModule.goodmemAuth;
export const actions = pieceModule.goodmem.actions();

export function invoke({ name, props, auth, files }) {
  const defaults = Object.fromEntries(
    Object.entries(actions[name].props)
      .filter(([, prop]) => prop.defaultValue !== undefined)
      .map(([key, prop]) => [key, prop.defaultValue])
  );
  const context = createMockActionContext({
    propsValue: { ...defaults, ...props },
  });
  return actions[name].run({
    ...context,
    auth: { props: auth },
    ...(files ? { files } : {}),
  });
}

export function ndjson(events) {
  return {
    type: 'application/x-ndjson',
    body: events.map((event) => JSON.stringify(event)).join('\n') + '\n',
  };
}

export async function withServer({ handler, exercise }) {
  const requests = [];
  const server = createServer(async (req, res) => {
    try {
      const buffers = [];
      for await (const part of req) buffers.push(part);
      const raw = Buffer.concat(buffers);
      const type = req.headers['content-type'] ?? '';
      const form = type.includes('multipart/form-data')
        ? await new Response(raw, {
            headers: { 'content-type': type },
          }).formData()
        : undefined;
      const body = form
        ? JSON.parse(form.get('request'))
        : raw.length
        ? JSON.parse(raw.toString())
        : undefined;
      const request = { method: req.method, url: req.url, body, form };
      requests.push(request);
      const reply = await handler(request);
      if (res.destroyed) return;
      res.writeHead(reply.status ?? 200, {
        'content-type': reply.type ?? 'application/json',
      });
      res.end(
        Buffer.isBuffer(reply.body) || typeof reply.body === 'string'
          ? reply.body
          : JSON.stringify(reply.body)
      );
    } catch (error) {
      res.writeHead(500, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: error.message }));
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await exercise({
      auth: {
        baseUrl: `http://127.0.0.1:${server.address().port}`,
        apiKey: 'gm_test_key',
      },
      requests,
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
