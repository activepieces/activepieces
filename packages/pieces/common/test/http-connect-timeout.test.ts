import { createServer, ServerResponse } from 'node:http';
import { createRequire } from 'node:module';
import net from 'node:net';
import { Readable } from 'node:stream';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Agent } from 'undici';
import { FetchHttpClient } from '../src/lib/http/core/fetch-http-client';
import { HttpMethod } from '../src/lib/http/core/http-method';

vi.mock('undici', () => ({ Agent: vi.fn(function () { return { close: vi.fn().mockResolvedValue(undefined) }; }) }));

afterEach(() => {
  vi.clearAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

const request = { method: HttpMethod.GET, url: 'http://example.test' };

describe('request connection deadline', () => {
  test.each([undefined, 0, 30000])('configures the dispatcher for %s', async (timeout) => {
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    await new FetchHttpClient().sendRequest({ ...request, timeout });
    if (timeout) {
      expect(Agent).toHaveBeenCalledWith({ connect: { timeout: 30000 } });
      const dispatcher = vi.mocked(Agent).mock.results[0].value;
      expect(fetch.mock.calls[0][1].dispatcher).toBe(dispatcher);
      expect(dispatcher.close).toHaveBeenCalledOnce();
    } else {
      expect(Agent).not.toHaveBeenCalled();
      expect(fetch.mock.calls[0][1].dispatcher).toBeUndefined();
    }
  });

  test('leaves an injected dispatcher owned by its caller', async () => {
    const dispatcher = { close: vi.fn() };
    const fetch = vi.fn().mockResolvedValue(new Response('{}'));
    vi.stubGlobal('fetch', fetch);
    await new FetchHttpClient().sendRequest({ ...request, timeout: 30000 }, { dispatcher });
    expect(fetch.mock.calls[0][1].dispatcher).toBe(dispatcher);
    expect(Agent).not.toHaveBeenCalled();
    expect(dispatcher.close).not.toHaveBeenCalled();
  });

  test('aborts at the request deadline and closes its agent', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url: string, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
    })));
    const result = new FetchHttpClient().sendRequest({ ...request, timeout: 50 });
    const assertion = expect(result).rejects.toThrow('aborted');
    await vi.advanceTimersByTimeAsync(50);
    await assertion;
    expect(vi.mocked(Agent).mock.results[0].value.close).toHaveBeenCalledOnce();
  });

  test('shares and closes the agent after retry exhaustion', async () => {
    vi.useFakeTimers();
    const fetch = vi.fn().mockRejectedValue(new Error('connection failed'));
    vi.stubGlobal('fetch', fetch);
    const result = new FetchHttpClient().sendRequest({ ...request, timeout: 30000, retries: 1 });
    const assertion = expect(result).rejects.toThrow('connection failed');
    await vi.advanceTimersByTimeAsync(1000);
    await assertion;
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(Agent).toHaveBeenCalledOnce();
    expect(vi.mocked(Agent).mock.results[0].value.close).toHaveBeenCalledOnce();
  });

  test('graceful closure preserves a response that is still streaming', async () => {
    const { Agent: RealAgent }: typeof import('undici') = createRequire(import.meta.url)('undici');
    const agent = new RealAgent({ connect: { timeout: 30000 } });
    const close = vi.spyOn(agent, 'close');
    vi.mocked(Agent).mockImplementationOnce(function () { return agent; });
    let outgoing: ServerResponse | undefined;
    const server = createServer((_request, response) => {
      outgoing = response;
      response.write('first');
    });
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
    try {
      const address = server.address();
      if (!address || typeof address === 'string') throw new Error('Missing address');
      const response = await new FetchHttpClient().sendRequest<Readable>({
        ...request, url: `http://127.0.0.1:${address.port}`, timeout: 30000, responseType: 'stream',
      });
      expect(close).toHaveBeenCalled();
      outgoing?.end('last');
      const chunks = await response.body.toArray();
      expect(Buffer.concat(chunks).toString()).toBe('firstlast');
      await close.mock.results[0].value;
    } finally {
      await agent.destroy();
      server.close();
      vi.restoreAllMocks();
    }
  });
});

test.each([15000, 35000])('the pinned connector enforces 30000ms for a connection taking %sms', async (delay) => {
  vi.useFakeTimers();
  const require = createRequire(import.meta.url);
  const { buildConnector }: typeof import('undici') = require('undici');
  const timers: { setFastTimeout: typeof setTimeout; clearFastTimeout: typeof clearTimeout } = require('undici/lib/util/timers');
  const socket = new net.Socket();
  vi.spyOn(net, 'connect').mockReturnValue(socket);
  vi.spyOn(timers, 'setFastTimeout').mockImplementation((callback, timeout) => setTimeout(callback, timeout));
  vi.spyOn(timers, 'clearFastTimeout').mockImplementation((timer) => clearTimeout(timer));
  const callback = vi.fn();
  try {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}')));
    await new FetchHttpClient().sendRequest({ ...request, timeout: 30000 });
    const options = vi.mocked(Agent).mock.calls[0][0];
    if (typeof options?.connect !== 'object') throw new Error('Missing connector options');
    buildConnector(options.connect)({ hostname: 'example.test', protocol: 'http:', port: '80' }, callback);
    setTimeout(() => socket.emit('connect'), delay);
    await vi.advanceTimersByTimeAsync(Math.min(delay, 31000));
    if (delay < 30000) {
      expect(callback).toHaveBeenCalledWith(null, socket);
    } else {
      expect(callback).toHaveBeenCalledWith(expect.objectContaining({ code: 'UND_ERR_CONNECT_TIMEOUT' }));
    }
  } finally {
    socket.destroy();
    vi.restoreAllMocks();
  }
});
