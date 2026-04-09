/// <reference types="vitest/globals" />

import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { AxiosHttpClient, HttpMethod } from '@activepieces/pieces-common';



beforeEach(() => {
  process.env['AP_SSRF_PROTECTION_ENABLED'] = 'true';
  process.env['AP_SSRF_ALLOW_LIST'] = '192.168.1.1';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('AxiosHttpClient – SSRF protection', () => {
  it('blocks requests to loopback address (127.0.0.1)', async () => {
    const client = new AxiosHttpClient();
    await expect(
      client.sendRequest({ method: HttpMethod.GET, url: 'http://127.0.0.1/' })
    ).rejects.toThrow();
  });

  it('applies SSRF agents for non-allowed hostnames', async () => {
    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    vi.spyOn(axios, 'create').mockReturnValue({ request: requestSpy } as unknown as ReturnType<typeof axios.create>);

    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://api.example.com/data' });

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpAgent).toBeDefined();
    expect(calledConfig.httpsAgent).toBeDefined();
  });

  it('does not apply SSRF agents for allowed hostnames', async () => {
    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    vi.spyOn(axios, 'create').mockReturnValue({ request: requestSpy } as unknown as ReturnType<typeof axios.create>);

    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://192.168.1.1/data' });

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpAgent.requestFilterOptions.allowIPAddressList).toContain('192.168.1.1');
    expect(calledConfig.httpsAgent.requestFilterOptions.allowIPAddressList).toContain('192.168.1.1');
  });

  it('does not apply SSRF agents when SSRF protection is disabled', async () => {
    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    vi.spyOn(axios, 'create').mockReturnValue({ request: requestSpy } as unknown as ReturnType<typeof axios.create>);

    process.env['AP_SSRF_PROTECTION_ENABLED'] = 'false';
    const client = new AxiosHttpClient();
    await client.sendRequest({ method: HttpMethod.GET, url: 'https://192.168.1.1/data' });

    const calledConfig = requestSpy.mock.calls[0][0];
    expect(calledConfig.httpAgent).toBeUndefined();
    expect(calledConfig.httpsAgent).toBeUndefined();
  });
});
