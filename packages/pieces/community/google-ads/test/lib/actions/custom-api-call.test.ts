import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

import { customApiCall } from '../../../src/lib/actions/custom-api-call';
import { API_VERSION } from '../../../src/lib/common/client';

const TOKEN = 'ya29.test-token';
const PATH = `/${API_VERSION}/customers/1234567890/googleAds:search`;

function runWith({ url, loginCustomerId = '' }: { url: string; loginCustomerId?: string }) {
  return customApiCall.run({
    auth: { access_token: TOKEN, props: { loginCustomerId } },
    propsValue: { url: { url }, method: HttpMethod.GET, headers: {}, queryParams: {}, failsafe: false },
    files: { write: vi.fn() },
  } as never);
}

describe('customApiCall', () => {
  const sendRequest = vi.spyOn(httpClient, 'sendRequest');

  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: { results: [] } });
  });

  afterEach(() => {
    sendRequest.mockReset();
  });

  it('should send relative paths to the Google Ads host with the bearer token', async () => {
    await runWith({ url: PATH, loginCustomerId: '999-888-7777' });

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({
      url: `https://googleads.googleapis.com${PATH}`,
      headers: { Authorization: `Bearer ${TOKEN}`, 'login-customer-id': '9998887777' },
    });
  });

  it('should accept absolute URLs on the Google Ads host', async () => {
    await runWith({ url: `https://googleads.googleapis.com${PATH}` });

    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({
      url: `https://googleads.googleapis.com${PATH}`,
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  it.each([
    'https://attacker.example.com/collect',
    'https://googleads.googleapis.com.attacker.example.com/v25/customers',
    'https://googleads.googleapis.com@attacker.example.com/v25/customers',
    'http://googleads.googleapis.com/v25/customers',
    'https://googleads.googleapis.com:8443/v25/customers',
    'https://',
  ])('should refuse to send the credentials to %s', async (url) => {
    await expect(runWith({ url })).rejects.toThrow('Custom API Call only sends your Google Ads credentials to https://googleads.googleapis.com');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
