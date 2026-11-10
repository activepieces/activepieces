import '../src';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { followCrawlPages } from '../src/lib/common/common';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const BASE = 'https://api.firecrawl.dev/v2/crawl/job-1';

function respondWith({ pages }: { pages: Record<string, { data: Record<string, unknown>[]; next: string | null }> }) {
  sendRequest.mockImplementation(async ({ url }: { url: string }) => {
    const page = pages[url];
    if (!page) {
      throw new Error(`unexpected request to ${url}`);
    }
    return { status: 200, headers: {}, body: page };
  });
}

describe('followCrawlPages', () => {
  beforeEach(() => {
    sendRequest.mockReset();
  });

  it('collects every page until next is empty', async () => {
    respondWith({
      pages: {
        [`${BASE}?skip=1`]: { data: [{ url: 'b' }], next: `${BASE}?skip=2` },
        [`${BASE}?skip=2`]: { data: [{ url: 'c' }], next: null },
      },
    });

    const result = await followCrawlPages({
      firstPage: { status: 'completed', total: 3, data: [{ url: 'a' }], next: `${BASE}?skip=1` },
      auth: 'key',
    });

    expect(result.data).toEqual([{ url: 'a' }, { url: 'b' }, { url: 'c' }]);
    expect(result.next).toBeNull();
    expect(result['status']).toBe('completed');
    expect(result['total']).toBe(3);
    expect(sendRequest).toHaveBeenCalledTimes(2);
    expect(sendRequest.mock.calls[0][0].headers).toEqual({ Authorization: 'Bearer key' });
  });

  it('stops when the next links form a cycle', async () => {
    respondWith({
      pages: {
        [`${BASE}?skip=1`]: { data: [{ url: 'b' }], next: `${BASE}?skip=2` },
        [`${BASE}?skip=2`]: { data: [{ url: 'c' }], next: `${BASE}?skip=1` },
      },
    });

    const result = await followCrawlPages({
      firstPage: { data: [{ url: 'a' }], next: `${BASE}?skip=1` },
      auth: 'key',
    });

    expect(result.data).toEqual([{ url: 'a' }, { url: 'b' }, { url: 'c' }]);
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('stops when next points to itself', async () => {
    respondWith({
      pages: {
        [`${BASE}?skip=1`]: { data: [{ url: 'b' }], next: `${BASE}?skip=1` },
      },
    });

    const result = await followCrawlPages({
      firstPage: { data: [{ url: 'a' }], next: `${BASE}?skip=1` },
      auth: 'key',
    });

    expect(result.data).toEqual([{ url: 'a' }, { url: 'b' }]);
    expect(sendRequest).toHaveBeenCalledTimes(1);
  });

  it('never sends the key to a host outside the Firecrawl API', async () => {
    const result = await followCrawlPages({
      firstPage: { data: [{ url: 'a' }], next: 'https://evil.example.com/v2/crawl/job-1?skip=1' },
      auth: 'key',
    });

    expect(result.data).toEqual([{ url: 'a' }]);
    expect(result.next).toBeNull();
    expect(sendRequest).not.toHaveBeenCalled();
  });

  it('returns the first page when there is no next link', async () => {
    const result = await followCrawlPages({
      firstPage: { status: 'scraping', data: [{ url: 'a' }] },
      auth: 'key',
    });

    expect(result.data).toEqual([{ url: 'a' }]);
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
