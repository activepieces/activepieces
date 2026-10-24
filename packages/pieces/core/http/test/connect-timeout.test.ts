import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { afterEach, expect, test, vi } from 'vitest';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { ProxyAgent } from 'undici';
import { httpSendRequestAction } from '../src/lib/actions/send-http-request-action';

vi.mock('undici', () => ({
  Agent: vi.fn(),
  ProxyAgent: vi.fn(function () { return { close: vi.fn().mockResolvedValue(undefined) }; }),
}));

afterEach(() => vi.restoreAllMocks());

test.each([false, true])('converts seconds and configures both proxy connector legs (proxy=%s)', async (use_proxy) => {
  const send = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: 'ok' });
  await httpSendRequestAction.run(createMockActionContext({ propsValue: {
    method: HttpMethod.GET, url: 'https://example.test', timeout: 30, use_proxy,
    proxy_settings: { proxy_host: 'proxy.test', proxy_port: 8080, proxy_username: 'user', proxy_password: 'pass' },
  } }));
  expect(send.mock.calls[0][0].timeout).toBe(30000);
  if (use_proxy) {
    expect(ProxyAgent).toHaveBeenCalledWith({ uri: 'http://user:pass@proxy.test:8080', proxyTls: { timeout: 30000 }, requestTls: { timeout: 30000 } });
    const dispatcher = vi.mocked(ProxyAgent).mock.results[0].value;
    expect(send.mock.calls[0][1]).toEqual({ dispatcher });
    expect(dispatcher.close).toHaveBeenCalledOnce();
  }
});

test.each(['continue_all', 'continue_none', 'retry_all'])('preserves %s behavior and closes failed proxy agents', async (failureMode) => {
  vi.mocked(ProxyAgent).mockClear();
  const error = Object.assign(new Error('fetch failed'), { cause: { code: 'UND_ERR_CONNECT_TIMEOUT', message: 'connect detail' } });
  const send = vi.spyOn(httpClient, 'sendRequest').mockRejectedValue(error);
  const result = httpSendRequestAction.run(createMockActionContext({ propsValue: {
    method: HttpMethod.GET, url: 'https://example.test', timeout: 30, use_proxy: true, failureMode,
    proxy_settings: { proxy_host: 'proxy.test', proxy_port: 8080 },
  } }));
  if (failureMode === 'continue_all') {
    await expect(result).resolves.toMatchObject({ response: { status: 0, body: 'fetch failed: UND_ERR_CONNECT_TIMEOUT: connect detail' } });
  } else {
    await expect(result).rejects.toBe(error);
  }
  expect(send).toHaveBeenCalledTimes(failureMode === 'retry_all' ? 3 : 1);
  for (const result of vi.mocked(ProxyAgent).mock.results) {
    expect(result.value.close).toHaveBeenCalledOnce();
  }
});

test('routes an authenticated request through a local CONNECT proxy', async () => {
  const { ProxyAgent: RealProxyAgent }: typeof import('undici') = createRequire(import.meta.url)('undici');
  vi.mocked(ProxyAgent).mockImplementationOnce(function (options) { return new RealProxyAgent(options); });
  const connected = vi.fn();
  const server = createServer();
  server.on('connect', (request, socket) => {
    connected(request.url, request.headers['proxy-authorization']);
    socket.write('HTTP/1.1 200 Connection Established\r\n\r\n');
    socket.once('data', () => {
      socket.end('HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nok');
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Missing address');
    const result = await httpSendRequestAction.run(createMockActionContext({ propsValue: {
      method: HttpMethod.GET, url: 'http://destination.test/path', timeout: 30, use_proxy: true,
      proxy_settings: { proxy_host: '127.0.0.1', proxy_port: address.port, proxy_username: 'user', proxy_password: 'pass' },
    } }));
    expect(result).toMatchObject({ status: 200, body: 'ok' });
    expect(connected).toHaveBeenCalledWith('destination.test:80', `Basic ${Buffer.from('user:pass').toString('base64')}`);
  } finally {
    server.close();
  }
});
