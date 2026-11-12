/// <reference types="vitest/globals" />

import { createMockActionContext } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { Agent, ProxyAgent } from 'undici';
import { httpSendRequestAction } from '../src/lib/actions/send-http-request-action';

const close = vi.fn(async () => undefined);

vi.mock('undici', () => ({
  Agent: vi.fn(function () {
    return { close };
  }),
  ProxyAgent: vi.fn(function () {
    return { close };
  }),
}));

function runAction(propsValue: Record<string, unknown>) {
  return httpSendRequestAction.run(
    createMockActionContext({
      propsValue: {
        method: HttpMethod.GET,
        url: 'https://example.com',
        headers: {},
        queryParams: {},
        failureMode: 'retry_all',
        ...propsValue,
      },
    })
  );
}

describe('send_request connect timeout', () => {
  beforeEach(() => vi.clearAllMocks());
  afterEach(() => vi.restoreAllMocks());

  test('applies the timeout to connecting and reuses one dispatcher across retries', async () => {
    const sendRequest = vi
      .spyOn(httpClient, 'sendRequest')
      .mockRejectedValueOnce(new Error('fetch failed'))
      .mockResolvedValueOnce({ status: 200, headers: {}, body: {} });

    await runAction({ timeout: 30 });

    expect(Agent).toHaveBeenCalledTimes(1);
    expect(Agent).toHaveBeenCalledWith({ connect: { timeout: 30000 } });
    const dispatchers = sendRequest.mock.calls.map(([, options]) => options?.dispatcher);
    expect(dispatchers).toHaveLength(2);
    expect(dispatchers[0]).toBeDefined();
    expect(dispatchers[1]).toBe(dispatchers[0]);
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('applies the timeout to the proxy connection', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: {} });

    await runAction({ timeout: 30, use_proxy: true, proxy_settings: { proxy_host: 'proxy.local', proxy_port: 8080 } });

    expect(Agent).not.toHaveBeenCalled();
    expect(ProxyAgent).toHaveBeenCalledWith({
      uri: 'http://proxy.local:8080',
      proxyTls: { timeout: 30000 },
      requestTls: { timeout: 30000 },
    });
    expect(close).toHaveBeenCalledTimes(1);
  });

  test('keeps the default dispatcher when no timeout is set', async () => {
    const sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: {} });

    await runAction({});

    expect(Agent).not.toHaveBeenCalled();
    expect(sendRequest.mock.calls[0][1]?.dispatcher).toBeUndefined();
  });
});
