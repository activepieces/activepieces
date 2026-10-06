import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fathom } from '../src/index';
import { apiKeyAuth, installFetch, jsonResponse, requestOf, runAction } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;

beforeEach(() => {
  fetchMock = installFetch();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function customApiCall() {
  const action = fathom.actions()['custom_api_call'];
  if (action === undefined) {
    throw new Error('custom_api_call is not registered');
  }
  return action;
}

function propsFor({ url }: { url: string }) {
  return { method: 'GET', url: { url }, headers: {}, queryParams: {}, failsafe: false };
}

describe('Custom API Call credential host lock', () => {
  it.each([
    'https://evil.example.com/meetings',
    'https://api.fathom.ai.evil.example.com/external/v1/meetings',
    'https://api.fathom.ai/external/v2/meetings',
    'http://api.fathom.ai/external/v1/meetings',
    '//evil.example.com/meetings',
  ])('refuses to send credentials to %s', async (url) => {
    await expect(runAction({ action: customApiCall(), propsValue: propsFor({ url }) })).rejects.toThrow(
      'Custom API Call only sends your Fathom credentials to https://api.fathom.ai/external/v1'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses path traversal out of the Fathom API base', async () => {
    await expect(
      runAction({ action: customApiCall(), propsValue: propsFor({ url: 'https://api.fathom.ai/external/v1/../admin' }) })
    ).rejects.toThrow('The URL must be a path on the Fathom API');
    await expect(runAction({ action: customApiCall(), propsValue: propsFor({ url: '/../admin' }) })).rejects.toThrow(
      'The URL must be a path on the Fathom API'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts a relative path and sends it to the Fathom API base with the OAuth token', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { items: [] } }));
    await runAction({ action: customApiCall(), propsValue: propsFor({ url: '/meetings' }) });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://api.fathom.ai/external/v1/meetings');
    expect(request.headers['authorization']).toBe('Bearer tok_test');
  });

  it('accepts a full Fathom API URL with an API key connection', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: { items: [] } }));
    await runAction({
      action: customApiCall(),
      propsValue: propsFor({ url: 'https://api.fathom.ai/external/v1/teams' }),
      auth: apiKeyAuth(),
    });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.url).toBe('https://api.fathom.ai/external/v1/teams');
    expect(request.headers['x-api-key']).toBe('key_test');
  });
});
