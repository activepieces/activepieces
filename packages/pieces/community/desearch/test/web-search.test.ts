import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AppConnectionType, createMockActionContext, PieceCategory } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { desearch } from '../src';
import { webSearch } from '../src/lib/actions/web-search';

function runSearch({ query = 'example', num, key = 'mock-api-key' }: { query?: string; num?: number; key?: string } = {}) {
  return webSearch.run({
    ...createMockActionContext<typeof webSearch.props>({ propsValue: { query, num } }),
    auth: { type: AppConnectionType.SECRET_TEXT, secret_text: key },
  });
}

describe('Desearch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Unexpected network request'); }));
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: [] } });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('registers the connection, metadata, and actions', () => {
    expect(desearch.authors).toEqual(['desearch']);
    expect(desearch.auth).toMatchObject({ displayName: 'API Key', required: true });
    expect(desearch.categories).toEqual([PieceCategory.ARTIFICIAL_INTELLIGENCE]);
    expect(desearch.minimumSupportedRelease).toBe('0.88.2');
    expect(desearch.logoUrl).toBe('https://cdn.activepieces.com/pieces/desearch.png');
    expect(desearch.getAction('web_search')).toBe(webSearch);
    expect(desearch.getAction('custom_api_call')).toBeDefined();
  });

  it('sends a Bearer authenticated GET, defaults count, and returns results', async () => {
    const body = { data: [{ title: 'Example', link: 'https://example.org', snippet: 'Summary' }] };
    vi.mocked(httpClient.sendRequest).mockResolvedValue({ status: 200, headers: {}, body });
    await expect(runSearch()).resolves.toEqual(body);
    expect(httpClient.sendRequest).toHaveBeenCalledExactlyOnceWith({
      method: HttpMethod.GET,
      url: 'https://api.desearch.ai/web',
      queryParams: { query: 'example', num: '10' },
      headers: { Authorization: 'Bearer mock-api-key' },
    });
  });

  it.each([1, 7, 20, 100])('caps result count %s at 20', async (num) => {
    await runSearch({ num });
    expect(httpClient.sendRequest).toHaveBeenCalledWith(expect.objectContaining({
      queryParams: { query: 'example', num: String(Math.min(num, 20)) },
    }));
  });

  it.each([0, -1, 1.5, NaN, Infinity])('rejects invalid count %s before HTTP', async (num) => {
    await expect(runSearch({ num })).rejects.toThrow('positive integer');
    expect(httpClient.sendRequest).not.toHaveBeenCalled();
  });

  it('rejects blank queries and missing keys before HTTP', async () => {
    await expect(runSearch({ query: ' ' })).rejects.toThrow('query is required');
    await expect(runSearch({ key: '' })).rejects.toThrow('API key is required');
    expect(httpClient.sendRequest).not.toHaveBeenCalled();
  });

  it('sanitizes HTTP failures', async () => {
    vi.mocked(httpClient.sendRequest).mockRejectedValue(new Error('Bearer mock-api-key confidential response'));
    await expect(runSearch()).rejects.toThrow(/^Desearch request failed\.$/);
  });

  it('authenticates custom API calls against the Desearch base URL', async () => {
    const action = desearch.getAction('custom_api_call');
    if (!action) throw new Error('Custom API action missing');
    await action.run({
      ...createMockActionContext({ propsValue: {
        method: HttpMethod.GET,
        url: { url: '/web' },
        headers: {},
        queryParams: { query: 'example' },
        body_type: 'none',
      } }),
      auth: { type: AppConnectionType.SECRET_TEXT, secret_text: 'custom-key' },
    });
    expect(httpClient.sendRequest).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://api.desearch.ai/web',
      headers: expect.objectContaining({ Authorization: 'Bearer custom-key' }),
    }));
  });
});
