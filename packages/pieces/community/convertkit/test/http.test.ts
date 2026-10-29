/// <reference types="vitest/globals" />

import { HttpMethod } from '@activepieces/pieces-common';
import { kitHttp, kitErrorStatus, redactKitSecret, describeKitError } from '../src/lib/common/http';
import { SECRET, messageOf, mockKit } from './helpers';

afterEach(() => vi.restoreAllMocks());

describe('kitHttp', () => {
  test('moves api_secret from the body to the query so the logged request body never carries it', async () => {
    const { requests } = mockKit([{ status: 201, body: { id: 1 } }]);
    await kitHttp.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.convertkit.com/v3/tags',
      body: { api_secret: SECRET, tag: { name: 'x' } },
    });
    expect(requests[0].body).toEqual({ tag: { name: 'x' } });
    expect(requests[0].queryParams).toEqual({ api_secret: SECRET });
    expect(JSON.stringify(requests[0].body)).not.toContain(SECRET);
  });

  test('keeps a GET request unchanged', async () => {
    const { requests } = mockKit([{ status: 200, body: { tags: [] } }]);
    await kitHttp.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.convertkit.com/v3/tags',
      queryParams: { api_secret: SECRET },
    });
    expect(requests[0].queryParams).toEqual({ api_secret: SECRET });
    expect(requests[0].body).toBeUndefined();
  });

  test('a Kit HTTP error rethrows with the status and never the secret', async () => {
    mockKit([{ error: { status: 404, body: { error: 'Not Found', echo: `api_secret=${SECRET}` } } }]);
    const error = await kitHttp
      .sendRequest({ method: HttpMethod.PUT, url: 'https://api.convertkit.com/v3/custom_fields/1', body: { api_secret: SECRET, label: 'x' } })
      .catch((e: unknown) => e);
    expect(messageOf(error)).toContain('Kit could not find the requested resource (404)');
    expect(messageOf(error)).not.toContain(SECRET);
    expect(kitErrorStatus(error)).toBe(404);
  });

  test('a network error message is redacted', async () => {
    vi.spyOn((await import('@activepieces/pieces-common')).httpClient, 'sendRequest').mockRejectedValue(
      new Error(`socket hang up ${JSON.stringify({ api_secret: SECRET })}`)
    );
    const error = await kitHttp
      .sendRequest({ method: HttpMethod.POST, url: 'https://api.convertkit.com/v3/tags', body: { api_secret: SECRET } })
      .catch((e: unknown) => e);
    expect(messageOf(error)).toContain('Kit API request failed');
    expect(messageOf(error)).not.toContain(SECRET);
    expect(kitErrorStatus(error)).toBeUndefined();
  });
});

describe('redactKitSecret', () => {
  test.each([
    [`{"api_secret":"${SECRET}"}`],
    [`{\\"api_secret\\":\\"${SECRET}\\"}`],
    [`https://api.convertkit.com/v3/tags?api_secret=${SECRET}&page=1`],
  ])('hides the secret in %s', (text) => {
    expect(redactKitSecret({ text })).not.toContain(SECRET);
  });

  test('hides a known secret value wherever it appears', () => {
    expect(redactKitSecret({ text: `raw ${SECRET} here`, secrets: [SECRET] })).toBe('raw [redacted] here');
  });

  test('describes a 401 as a credential problem', () => {
    expect(describeKitError({ status: 401, body: {} })).toContain('Kit rejected the API Secret (401)');
  });
});
