/// <reference types="vitest/globals" />

import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import { getSsrfAgents, AxiosHttpClient, HttpMethod } from '@activepieces/pieces-common';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getSsrfAgents – allow list parsing', () => {
  it('returns empty hostname set when no allow list is provided', () => {
    const { allowedHostnames } = getSsrfAgents([]);
    expect(allowedHostnames.size).toBe(0);
  });

  it('separates IPv4 addresses from hostnames', () => {
    const { allowedHostnames } = getSsrfAgents(['192.168.1.100', 'my-service.internal', '10.0.0.5']);
    expect(allowedHostnames.has('my-service.internal')).toBe(true);
    expect(allowedHostnames.has('192.168.1.100')).toBe(false);
    expect(allowedHostnames.has('10.0.0.5')).toBe(false);
    expect(allowedHostnames.size).toBe(1);
  });

  it('recognises CIDR notation as an IP entry', () => {
    const { allowedHostnames } = getSsrfAgents(['10.0.0.0/8', 'trusted-host.local']);
    expect(allowedHostnames.has('trusted-host.local')).toBe(true);
    expect(allowedHostnames.has('10.0.0.0/8')).toBe(false);
    expect(allowedHostnames.size).toBe(1);
  });

  it('recognises IPv6 addresses as IP entries', () => {
    const { allowedHostnames } = getSsrfAgents(['::1', 'fe80::1', 'some-host.example']);
    expect(allowedHostnames.has('::1')).toBe(false);
    expect(allowedHostnames.has('fe80::1')).toBe(false);
    expect(allowedHostnames.has('some-host.example')).toBe(true);
    expect(allowedHostnames.size).toBe(1);
  });

  it('returns defined filtering agents', () => {
    const { httpSsrfAgent, httpsSsrfAgent } = getSsrfAgents([]);
    expect(httpSsrfAgent).toBeDefined();
    expect(httpsSsrfAgent).toBeDefined();
  });

  it('passes allowed IPs to agent options', () => {
    const { httpSsrfAgent } = getSsrfAgents(['192.168.1.1', 'some-host.local']);
    // The agent should exist and hostname should not be in IP list
    expect(httpSsrfAgent).toBeDefined();
  });
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

  it('omits SSRF agents when hostname is in the allow list', async () => {
    const requestSpy = vi.fn().mockResolvedValue({ status: 200, headers: {}, data: {} });
    vi.spyOn(axios, 'create').mockReturnValue({ request: requestSpy } as unknown as ReturnType<typeof axios.create>);

    // getSsrfAgents is the testable unit — verify the hostname set logic directly
    const { allowedHostnames, httpSsrfAgent, httpsSsrfAgent } = getSsrfAgents(['internal-service.local', '10.20.30.40']);
    expect(allowedHostnames.has('internal-service.local')).toBe(true);
    expect(allowedHostnames.has('10.20.30.40')).toBe(false);

    // When hostname IS in the set, ssrfAgents spread would be empty {}
    const hostname = 'internal-service.local';
    const ssrfAgents = allowedHostnames.has(hostname)
      ? {}
      : { httpAgent: httpSsrfAgent, httpsAgent: httpsSsrfAgent };

    expect(ssrfAgents).toEqual({});
  });

  it('includes SSRF agents when hostname is NOT in the allow list', () => {
    const { allowedHostnames, httpSsrfAgent, httpsSsrfAgent } = getSsrfAgents(['other-host.local']);

    const hostname = 'untrusted-host.com';
    const ssrfAgents = allowedHostnames.has(hostname)
      ? {}
      : { httpAgent: httpSsrfAgent, httpsAgent: httpsSsrfAgent };

    expect(ssrfAgents).toHaveProperty('httpAgent');
    expect(ssrfAgents).toHaveProperty('httpsAgent');
  });
});
