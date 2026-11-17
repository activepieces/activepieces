import http from 'node:http';
import net from 'node:net';
import { createRequire } from 'node:module';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
const GMAIL_DIR = path.resolve(__dirname, '../src/lib/triggers');
const GMAIL_SDK = createRequire(path.join(GMAIL_DIR, 'new-email.ts')).resolve(
  '@googleapis/gmail'
);
const ACCESS_TOKEN = 'ya29.SECRET-OAUTH-ACCESS-TOKEN';
const PROXY_PASSWORD = 'S3cr3t-Proxy-Pa55';

const env = vi.hoisted(() => ({ rootUrl: '' }));
vi.doMock(GMAIL_SDK, async (importOriginal) => {
  const real = await importOriginal<typeof import('@googleapis/gmail')>();
  return {
    ...real,
    gmail: (opts: Record<string, unknown>) =>
      Reflect.apply(real.gmail, real, [{ ...opts, rootUrl: env.rootUrl }]),
  };
});

const RAW = Buffer.from(
  [
    'From: a@example.com',
    'To: me@example.com',
    'Subject: Hello',
    'Date: Mon, 05 Oct 2026 10:00:00 +0000',
    '',
    'hi',
    '',
  ].join('\r\n')
).toString('base64');
let internalDate = 0;
const authSeen: (string | undefined)[] = [];
const gmailServer = http.createServer((req, res) => {
  authSeen.push(req.headers.authorization);
  res.setHeader('content-type', 'application/json');
  if (req.headers.authorization !== `Bearer ${ACCESS_TOKEN}`) {
    res.statusCode = 401;
    return res.end(
      JSON.stringify({
        error: {
          code: 401,
          message: 'Request had invalid authentication credentials.',
        },
      })
    );
  }
  const url = new URL(req.url ?? '/', 'http://x');
  if (url.pathname === '/gmail/v1/users/me/messages')
    return res.end(
      JSON.stringify({ messages: [{ id: 'm1', threadId: 't1' }] })
    );
  if (url.pathname === '/gmail/v1/users/me/messages/m1')
    return res.end(
      JSON.stringify({
        id: 'm1',
        threadId: 't1',
        internalDate: String(internalDate),
        raw: RAW,
      })
    );
  if (url.pathname === '/gmail/v1/users/me/threads/t1')
    return res.end(
      JSON.stringify({
        id: 't1',
        historyId: '9',
        messages: [{ id: 'm1', threadId: 't1' }],
      })
    );
  res.statusCode = 404;
  res.end('{}');
});
const proxyServer = http.createServer((_req, res) => {
  res.statusCode = 405;
  res.end();
});
let proxyConnects = 0;
proxyServer.on('connect', (req, clientSocket, head) => {
  proxyConnects++;
  const [host, port] = (req.url ?? '').split(':');
  const upstream = net.connect(Number(port), host, () => {
    clientSocket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    upstream.write(head);
    upstream.pipe(clientSocket);
    clientSocket.pipe(upstream);
  });
  upstream.on('error', () => clientSocket.destroy());
});

beforeAll(async () => {
  for (const k of [
    'HTTPS_PROXY',
    'https_proxy',
    'HTTP_PROXY',
    'http_proxy',
    'NO_PROXY',
    'no_proxy',
  ])
    delete process.env[k];
  await new Promise<void>((r) => gmailServer.listen(0, '127.0.0.1', () => r()));
  await new Promise<void>((r) => proxyServer.listen(0, '127.0.0.1', () => r()));
  env.rootUrl = `http://127.0.0.1:${portOf(gmailServer)}/`;
});
afterAll(() => {
  gmailServer.close();
  proxyServer.close();
});

function portOf(server: http.Server): number {
  const address = server.address();
  if (address === null || typeof address === 'string') {
    throw new Error('server is not listening on a TCP port');
  }
  return address.port;
}

function field({ from, key }: { from: unknown; key: string }): unknown {
  return typeof from === 'object' && from !== null
    ? Reflect.get(from, key)
    : undefined;
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    async put(key: string, value: unknown): Promise<unknown> {
      data.set(key, value);
      return value;
    },
    async get(key: string): Promise<unknown> {
      return data.has(key) ? data.get(key) : null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

async function pollNewEmailAndSerialize(): Promise<{
  serialized: string | null;
  serializeError: string | null;
  threadKeys: string[];
  threadId: unknown;
}> {
  const { gmailNewEmailTrigger } = await import(
    path.join(GMAIL_DIR, 'new-email.ts')
  );
  const ctx = {
    auth: {
      type: 'OAUTH2',
      access_token: ACCESS_TOKEN,
      token_type: 'Bearer',
      data: {},
    },
    store: memoryStore(),
    propsValue: {},
    files: { write: async () => 'https://files.test/x' },
  };
  await gmailNewEmailTrigger.onEnable(ctx);
  internalDate = Date.now() + 5000;
  const events: unknown[] = await gmailNewEmailTrigger.run(ctx);
  expect(events).toHaveLength(1);
  const thread = field({ from: events[0], key: 'thread' });
  const threadKeys = Object.keys(Object(thread));
  const threadId = field({
    from: field({ from: thread, key: 'data' }),
    key: 'id',
  });
  try {
    return {
      serialized: JSON.stringify(
        JSON.parse(JSON.stringify({ output: events }))
      ),
      serializeError: null,
      threadKeys,
      threadId,
    };
  } catch (e) {
    return {
      serialized: null,
      serializeError: (e instanceof Error ? e.message : String(e)).split(
        '\n'
      )[0],
      threadKeys,
      threadId,
    };
  }
}

describe('Gmail New Email behind an HTTP(S) proxy', () => {
  it('does not put the proxy URL with its credentials into the event, and the event still serializes', async () => {
    const proxyUrl = `http://ap-egress:${PROXY_PASSWORD}@127.0.0.1:${portOf(
      proxyServer
    )}`;
    process.env.HTTPS_PROXY = proxyUrl;
    process.env.HTTP_PROXY = proxyUrl;
    const { serialized, serializeError, threadKeys, threadId } =
      await pollNewEmailAndSerialize();
    delete process.env.HTTPS_PROXY;
    delete process.env.HTTP_PROXY;
    expect(authSeen.at(-1)).toBe(`Bearer ${ACCESS_TOKEN}`);
    expect(proxyConnects).toBeGreaterThan(0);
    expect(threadKeys).toEqual(['data']);
    expect(threadId).toBe('t1');
    expect(serialized).not.toContain(ACCESS_TOKEN);
    expect(serialized).not.toContain('"config"');
    expect({
      serializeError,
      proxyPasswordInEvent:
        serialized === null ? null : serialized.includes(PROXY_PASSWORD),
    }).toEqual({
      serializeError: null,
      proxyPasswordInEvent: false,
    });
  });
});
