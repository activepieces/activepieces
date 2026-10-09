import { createServer, RequestListener, Server } from 'node:http';
import { Readable } from 'node:stream';
import { buffer } from 'node:stream/consumers';
import { setTimeout as delay } from 'node:timers/promises';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { FetchHttpClient } from '../src/lib/http/core/fetch-http-client';
import { HttpError } from '../src/lib/http/core/http-error';
import { HttpMethod } from '../src/lib/http/core/http-method';
import { HttpRequest } from '../src/lib/http/core/http-request';

describe('HTTP response timeout', () => {
  let server: Server;
  let url: string;
  let handleRequest: RequestListener;
  const client = new FetchHttpClient();

  beforeEach(async () => {
    handleRequest = (_request, response) => response.end('{}');
    server = createServer((request, response) => handleRequest(request, response));
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    const address = server.address();
    if (address === null || typeof address === 'string') {
      throw new Error('HTTP test server did not bind to a port');
    }
    url = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    vi.restoreAllMocks();
  });

  function slowBody({ status = 200, delayMs = 500 }: { status?: number; delayMs?: number } = {}) {
    handleRequest = (_request, response) => {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.flushHeaders();
      const timer = setTimeout(() => response.end('{"ok":true}'), delayMs);
      response.once('close', () => clearTimeout(timer));
    };
  }

  test.each(['json', 'text', 'arraybuffer', 'blob'] satisfies HttpRequest['responseType'][])(
    'aborts a slow %s response body after receiving headers',
    async (responseType) => {
      slowBody();
      await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 80, responseType }))
        .rejects.toMatchObject({ name: 'AbortError' });
    },
  );

  test.each([400, 503])('aborts a slow HTTP %s error body', async (status) => {
    slowBody({ status });
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 80 }))
      .rejects.toMatchObject({ name: 'AbortError' });
  });

  test('still aborts before delayed response headers', async () => {
    handleRequest = (_request, response) => {
      const timer = setTimeout(() => response.end('{}'), 500);
      response.once('close', () => clearTimeout(timer));
    };
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 80 }))
      .rejects.toMatchObject({ name: 'AbortError' });
  });

  test.each([undefined, 0])('allows slow bodies when timeout is %s', async (timeout) => {
    slowBody({ delayMs: 120 });
    const response = await client.sendRequest({ method: HttpMethod.GET, url, timeout });
    expect(response.body).toEqual({ ok: true });
  });

  test('clears the timer after a completed buffered response', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await client.sendRequest({ method: HttpMethod.GET, url, timeout: 80 });
    expect(response.body).toEqual({});
    await delay(120);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  test('clears the timer after reading an HTTP error body', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    handleRequest = (_request, response) => {
      response.writeHead(400);
      response.end('{"error":"invalid"}');
    };
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 80 })).rejects.toBeInstanceOf(HttpError);
    await delay(120);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  test('clears the timer after a fetch failure', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    handleRequest = (request) => request.socket.destroy();
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 200 })).rejects.toBeInstanceOf(TypeError);
    await delay(250);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  test('clears the timer when reading a malformed compressed body fails', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    handleRequest = (_request, response) => {
      response.writeHead(200, { 'Content-Encoding': 'gzip' });
      response.end('invalid gzip');
    };
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 200 })).rejects.toBeInstanceOf(TypeError);
    await delay(250);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  test('aborts a slow stream while the caller consumes it', async () => {
    slowBody();
    const response = await client.sendRequest<Readable>({ method: HttpMethod.GET, url, timeout: 80, responseType: 'stream' });
    await expect(buffer(response.body)).rejects.toMatchObject({ name: 'AbortError' });
    expect(response.body.destroyed).toBe(true);
  });

  test('destroys an unread stream at its deadline without an unhandled error', async () => {
    slowBody();
    const response = await client.sendRequest<Readable>({ method: HttpMethod.GET, url, timeout: 80, responseType: 'stream' });
    await new Promise<void>((resolve) => response.body.once('close', resolve));
    expect(response.body.destroyed).toBe(true);
    expect(response.body.errored?.name).toBe('AbortError');
  });

  test('clears the timer for a stream response with no body', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    handleRequest = (_request, response) => {
      response.writeHead(204);
      response.end();
    };
    const response = await client.sendRequest<Readable>({ method: HttpMethod.GET, url, timeout: 80, responseType: 'stream' });
    await delay(120);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
    expect(await buffer(response.body)).toEqual(Buffer.alloc(0));
  });

  test.each(['end', 'destroy'])('clears the timer after stream %s', async (termination) => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await client.sendRequest<Readable>({ method: HttpMethod.GET, url, timeout: 80, responseType: 'stream' });
    if (termination === 'end') {
      expect((await buffer(response.body)).toString()).toBe('{}');
    } else {
      await new Promise<void>((resolve) => {
        response.body.once('close', resolve);
        response.body.destroy();
      });
    }
    await delay(120);
    expect(fetchSpy.mock.calls[0][1]?.signal?.aborted).toBe(false);
  });

  test('cancels a discarded 503 body and gives the retry its own timeout', async () => {
    let attempts = 0;
    let discardedResponseClosed = false;
    handleRequest = (_request, response) => {
      attempts++;
      if (attempts === 1) {
        response.writeHead(503);
        response.flushHeaders();
        response.once('close', () => { discardedResponseClosed = true; });
      } else {
        response.writeHead(200);
        response.flushHeaders();
        const timer = setTimeout(() => response.end('{"ok":true}'), 60);
        response.once('close', () => clearTimeout(timer));
      }
    };
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    const response = await client.sendRequest({ method: HttpMethod.GET, url, timeout: 200, retries: 1 });
    expect(response.body).toEqual({ ok: true });
    expect(attempts).toBe(2);
    expect(discardedResponseClosed).toBe(true);
    expect(fetchSpy.mock.calls.map((call) => call[1]?.signal?.aborted)).toEqual([false, false]);
  });

  test('applies the timeout to the final 503 body after exhausting retries', async () => {
    slowBody({ status: 503 });
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    await expect(client.sendRequest({ method: HttpMethod.GET, url, timeout: 80, retries: 1 }))
      .rejects.toMatchObject({ name: 'AbortError' });
    expect(fetchSpy.mock.calls.map((call) => call[1]?.signal?.aborted)).toEqual([false, true]);
  });
});
