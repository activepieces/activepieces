/// <reference types="vitest/globals" />

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { AxiosHttpClient, HttpMethod } from '@activepieces/pieces-common';
import type { AxiosInstance } from 'axios';

describe('AxiosHttpClient', () => {
  beforeEach(() => {
    delete process.env['HTTP_PROXY'];
    delete process.env['HTTPS_PROXY'];
    delete process.env['http_proxy'];
    delete process.env['https_proxy'];
  });

  afterEach(() => {
    delete process.env['HTTP_PROXY'];
    delete process.env['HTTPS_PROXY'];
    delete process.env['http_proxy'];
    delete process.env['https_proxy'];
  });

  it('does not attach a proxy agent when HTTP_PROXY / HTTPS_PROXY are unset', async () => {
    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    const fakeAxios = { request: requestSpy } as unknown as AxiosInstance;

    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://api.example.com/data' }, fakeAxios);

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpAgent).toBeUndefined();
    expect(calledConfig.httpsAgent).toBeUndefined();
    expect(calledConfig.proxy).toBeUndefined();
  });

  it('attaches proxy agents when HTTPS_PROXY is set (and disables axios built-in proxy detection)', async () => {
    process.env['HTTPS_PROXY'] = 'http://127.0.0.1:4444';
    process.env['HTTP_PROXY'] = 'http://127.0.0.1:4444';

    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    const fakeAxios = { request: requestSpy } as unknown as AxiosInstance;

    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://api.example.com/data' }, fakeAxios);

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpAgent?.constructor?.name).toBe('HttpProxyAgent');
    expect(calledConfig.httpsAgent?.constructor?.name).toBe('HttpsProxyAgent');
    expect(calledConfig.proxy).toBe(false);
  });

  it('honours lowercase http_proxy / https_proxy (curl-style env)', async () => {
    process.env['https_proxy'] = 'http://127.0.0.1:4444';

    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    const fakeAxios = { request: requestSpy } as unknown as AxiosInstance;

    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://api.example.com/data' }, fakeAxios);

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpsAgent?.constructor?.name).toBe('HttpsProxyAgent');
  });
});
