import {
  HttpMethod,
  HttpRequest,
  HttpResponse,
  httpClient,
} from '@activepieces/pieces-common';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { map } from './map';
import { scrape } from './scrape';
import { search } from './search';
import { crawlResults } from './crawl-results';

const AUTH = { secret_text: 'test-key' };
const BASE_URL = 'https://fastcrw.com/api/v1';

function resp(body: unknown): HttpResponse {
  return { status: 200, headers: {}, body };
}

function context(propsValue: Record<string, unknown>) {
  return {
    auth: AUTH,
    propsValue,
    files: { write: async () => 'file-url' },
  } as never;
}

let sendRequest: ReturnType<typeof vi.spyOn>;

function lastRequest(): HttpRequest {
  const calls = sendRequest.mock.calls;
  return calls[calls.length - 1][0] as HttpRequest;
}

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('map', () => {
  it('posts to the fastCRW map endpoint with bearer auth', async () => {
    sendRequest.mockResolvedValue(resp({ success: true, links: ['https://example.com'] }));

    const result = await map.run(
      context({ url: 'https://example.com', subdomain: false, limit: 100 })
    );

    const request = lastRequest();
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${BASE_URL}/map`);
    expect(request.headers?.['Authorization']).toBe('Bearer test-key');
    expect(request.body).toMatchObject({
      url: 'https://example.com',
      includeSubdomains: false,
      limit: 100,
    });
    expect(result).toEqual({ success: true, links: ['https://example.com'] });
  });
});

describe('search', () => {
  it('posts the query, limit and sources to the search endpoint', async () => {
    sendRequest.mockResolvedValue(
      resp({ success: true, data: [{ title: 't', url: 'u', description: 'd' }] })
    );

    const result = await search.run(
      context({ query: 'fastcrw', limit: 3, sources: ['web'] })
    );

    const request = lastRequest();
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${BASE_URL}/search`);
    expect(request.headers?.['Authorization']).toBe('Bearer test-key');
    expect(request.body).toMatchObject({
      query: 'fastcrw',
      limit: 3,
      sources: ['web'],
    });
    expect(result).toMatchObject({ success: true });
  });
});

describe('crawlResults', () => {
  it('gets crawl status by id', async () => {
    sendRequest.mockResolvedValue(resp({ status: 'completed', data: [] }));

    const result = await crawlResults.run(context({ crawlId: 'job-123' }));

    const request = lastRequest();
    expect(request.method).toBe(HttpMethod.GET);
    expect(request.url).toBe(`${BASE_URL}/crawl/job-123`);
    expect(request.headers?.['Authorization']).toBe('Bearer test-key');
    expect(result).toMatchObject({ status: 'completed' });
  });
});

describe('scrape', () => {
  it('posts markdown format and returns reordered data', async () => {
    sendRequest.mockResolvedValue(
      resp({
        success: true,
        data: { markdown: '# hi', screenshot: undefined, metadata: { title: 't' } },
      })
    );

    const result = await scrape.run(
      context({ url: 'https://example.com', timeout: 60000, formats: 'markdown', useActions: false })
    );

    const request = lastRequest();
    expect(request.method).toBe(HttpMethod.POST);
    expect(request.url).toBe(`${BASE_URL}/scrape`);
    expect(request.headers?.['Authorization']).toBe('Bearer test-key');
    expect(request.body).toMatchObject({ url: 'https://example.com' });
    expect(result.data).toMatchObject({ markdown: '# hi' });
  });
});
