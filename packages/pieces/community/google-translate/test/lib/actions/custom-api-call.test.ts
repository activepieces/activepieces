import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { customApiCall } from '../../../src/lib/actions/custom-api-call';

const TOKEN = 'ya29.test-token';

function callContext(url: string) {
  return {
    auth: { access_token: TOKEN },
    propsValue: { url: { url }, method: HttpMethod.GET, headers: {}, queryParams: {} },
  } as never;
}

describe('customApiCall', () => {
  const sendRequest = vi.spyOn(httpClient, 'sendRequest');

  beforeEach(() => {
    sendRequest.mockReset();
    sendRequest.mockResolvedValue({ status: 200, headers: {}, body: { ok: true } });
  });

  afterEach(() => {
    sendRequest.mockReset();
  });

  it('should send the bearer token to a path relative to the Translation API', async () => {
    await customApiCall.run(callContext('/language/translate/v2/languages'));

    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({
      url: 'https://translation.googleapis.com/language/translate/v2/languages',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  it('should send the bearer token to an absolute URL on the Translation API host', async () => {
    await customApiCall.run(
      callContext('https://translation.googleapis.com/language/translate/v2/languages')
    );

    expect(sendRequest.mock.calls[0]?.[0]).toMatchObject({
      url: 'https://translation.googleapis.com/language/translate/v2/languages',
      headers: { Authorization: `Bearer ${TOKEN}` },
    });
  });

  it.each([
    'https://attacker.example.com/collect',
    'https://translation.googleapis.com.attacker.example.com/v2',
    'https://user@attacker.example.com/v2',
    'http://translation.googleapis.com/language/translate/v2',
    'https://www.googleapis.com/drive/v3/files',
  ])('should refuse to send the token to %s', async (url) => {
    await expect(customApiCall.run(callContext(url))).rejects.toThrow(
      'Custom API Call only sends your Google credentials to https://translation.googleapis.com'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('should refuse a malformed absolute URL', async () => {
    await expect(customApiCall.run(callContext('https://'))).rejects.toThrow(
      'but the URL points to https://.'
    );
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
