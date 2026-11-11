import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { sallaApi } from '../src/lib/common/client';

const auth = { access_token: 'token' };

type PageSpec = { data: unknown[]; pagination?: unknown };

function mockPages(pages: PageSpec[]) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    const page = Number(new URL(request.url).searchParams.get('page'));
    const spec = pages[page - 1] ?? { data: [] };
    return { status: 200, headers: {}, body: { status: 200, success: true, data: spec.data, pagination: spec.pagination } };
  });
}

function urlsOf(spy: ReturnType<typeof mockPages>): URL[] {
  return spy.mock.calls.map((call) => new URL(call[0].url));
}

function ids({ from, count }: { from: number; count: number }) {
  return Array.from({ length: count }, (_, index) => ({ id: from + index }));
}

function pageShape({ currentPage, totalPages }: { currentPage: number; totalPages: number }) {
  return {
    count: 2,
    total: totalPages * 2,
    perPage: 2,
    currentPage,
    totalPages,
    links: currentPage < totalPages ? { next: `https://api.salla.dev/admin/v2/orders?page=${currentPage + 1}` } : [],
  };
}

function cursorShape({ current, next }: { current: number; next: unknown }) {
  return { count: 2, current, next };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('hasNextPage', () => {
  it('reads the currentPage/totalPages shape', () => {
    expect(sallaApi.hasNextPage(pageShape({ currentPage: 1, totalPages: 3 }))).toBe(true);
    expect(sallaApi.hasNextPage(pageShape({ currentPage: 3, totalPages: 3 }))).toBe(false);
    expect(sallaApi.hasNextPage({ currentPage: '1', totalPages: '2' })).toBe(true);
  });

  it('reads the cursor shape', () => {
    expect(sallaApi.hasNextPage(cursorShape({ current: 1, next: 2 }))).toBe(true);
    expect(sallaApi.hasNextPage(cursorShape({ current: 1, next: 'https://api.salla.dev/admin/v2/customers?page=2' }))).toBe(true);
    expect(sallaApi.hasNextPage(cursorShape({ current: 2, next: null }))).toBe(false);
    expect(sallaApi.hasNextPage(cursorShape({ current: 2, next: '' }))).toBe(false);
    expect(sallaApi.hasNextPage(cursorShape({ current: 2, next: false }))).toBe(false);
  });

  it('reads links.next and treats links: [] as the last page', () => {
    expect(sallaApi.hasNextPage({ count: 2, links: { next: 'https://x?page=2' } })).toBe(true);
    expect(sallaApi.hasNextPage({ count: 2, links: { next: null } })).toBe(false);
    expect(sallaApi.hasNextPage({ count: 2, links: [] })).toBe(false);
  });

  it('returns false when there is no pagination object', () => {
    expect(sallaApi.hasNextPage(undefined)).toBe(false);
    expect(sallaApi.hasNextPage(null)).toBe(false);
    expect(sallaApi.hasNextPage([])).toBe(false);
    expect(sallaApi.hasNextPage('next')).toBe(false);
  });
});

describe('fetchPaged', () => {
  it('walks currentPage/totalPages pages in order and stops on the last page', async () => {
    const spy = mockPages([
      { data: ids({ from: 1, count: 2 }), pagination: pageShape({ currentPage: 1, totalPages: 3 }) },
      { data: ids({ from: 3, count: 2 }), pagination: pageShape({ currentPage: 2, totalPages: 3 }) },
      { data: ids({ from: 5, count: 2 }), pagination: pageShape({ currentPage: 3, totalPages: 3 }) },
      { data: ids({ from: 99, count: 2 }), pagination: pageShape({ currentPage: 4, totalPages: 4 }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/orders', maxItems: 100 });
    expect(result.items).toEqual(ids({ from: 1, count: 6 }));
    expect(result.truncated).toBe(false);
    expect(result.pagesFetched).toBe(3);
    expect(urlsOf(spy).map((url) => url.searchParams.get('page'))).toEqual(['1', '2', '3']);
  });

  it('walks cursor-style pages until next is null', async () => {
    const spy = mockPages([
      { data: ids({ from: 1, count: 2 }), pagination: cursorShape({ current: 1, next: 2 }) },
      { data: ids({ from: 3, count: 2 }), pagination: cursorShape({ current: 2, next: null }) },
      { data: ids({ from: 99, count: 2 }), pagination: cursorShape({ current: 3, next: null }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/customers', maxItems: 100 });
    expect(result.items).toEqual(ids({ from: 1, count: 4 }));
    expect(result.truncated).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('stops when a page has no pagination object', async () => {
    const spy = mockPages([{ data: ids({ from: 1, count: 2 }) }, { data: ids({ from: 3, count: 2 }) }]);
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 100 });
    expect(result.items).toEqual(ids({ from: 1, count: 2 }));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('stops on an empty page even if pagination says there is more', async () => {
    const spy = mockPages([
      { data: ids({ from: 1, count: 2 }), pagination: pageShape({ currentPage: 1, totalPages: 5 }) },
      { data: [], pagination: pageShape({ currentPage: 2, totalPages: 5 }) },
      { data: ids({ from: 5, count: 2 }), pagination: pageShape({ currentPage: 3, totalPages: 5 }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/orders', maxItems: 100 });
    expect(result.items).toEqual(ids({ from: 1, count: 2 }));
    expect(result.truncated).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('treats a non-array data field as an empty page', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: { data: { id: 1 } } });
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 10 });
    expect(result).toEqual({ items: [], truncated: false, pagesFetched: 1 });
  });

  it('stops at the item cap and reports truncated when more items exist on the page', async () => {
    const spy = mockPages([
      { data: ids({ from: 1, count: 3 }), pagination: pageShape({ currentPage: 1, totalPages: 3 }) },
      { data: ids({ from: 4, count: 3 }), pagination: pageShape({ currentPage: 2, totalPages: 3 }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 4 });
    expect(result.items).toEqual(ids({ from: 1, count: 4 }));
    expect(result.truncated).toBe(true);
    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('reports truncated when the cap lands on a page boundary and more pages exist', async () => {
    const spy = mockPages([
      { data: ids({ from: 1, count: 2 }), pagination: pageShape({ currentPage: 1, totalPages: 3 }) },
      { data: ids({ from: 3, count: 2 }), pagination: pageShape({ currentPage: 2, totalPages: 3 }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 2 });
    expect(result.items).toEqual(ids({ from: 1, count: 2 }));
    expect(result.truncated).toBe(true);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('does not report truncated when the cap equals the last item', async () => {
    mockPages([
      { data: ids({ from: 1, count: 2 }), pagination: pageShape({ currentPage: 1, totalPages: 2 }) },
      { data: ids({ from: 3, count: 2 }), pagination: pageShape({ currentPage: 2, totalPages: 2 }) },
    ]);
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 4 });
    expect(result.items).toHaveLength(4);
    expect(result.truncated).toBe(false);
  });

  it('stops at the page cap and reports truncated', async () => {
    const pages = Array.from({ length: 10 }, (_, index) => ({
      data: ids({ from: index * 2 + 1, count: 2 }),
      pagination: pageShape({ currentPage: index + 1, totalPages: 10 }),
    }));
    const spy = mockPages(pages);
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 100, maxPages: 3 });
    expect(result.items).toEqual(ids({ from: 1, count: 6 }));
    expect(result.truncated).toBe(true);
    expect(result.pagesFetched).toBe(3);
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('never walks more than 50 pages even when asked for more', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
      const page = Number(new URL(request.url).searchParams.get('page'));
      return { status: 200, headers: {}, body: { data: [{ id: page }], pagination: { currentPage: page, totalPages: 500 } } };
    });
    const result = await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 1000, maxPages: 500 });
    expect(spy).toHaveBeenCalledTimes(50);
    expect(result.truncated).toBe(true);
  });

  it('clamps per_page to 60 and at least 1, defaulting to 30', async () => {
    const spy = mockPages([{ data: ids({ from: 1, count: 1 }) }]);
    await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 10, perPage: 500 });
    await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 10, perPage: 0 });
    await sallaApi.fetchPaged({ auth, path: '/x', maxItems: 10 });
    expect(urlsOf(spy).map((url) => url.searchParams.get('per_page'))).toEqual(['60', '1', '30']);
  });

  it('falls back to the default item limit for bad maxItems and caps at 1000', () => {
    expect(sallaApi.clampLimit(0)).toBe(50);
    expect(sallaApi.clampLimit(-5)).toBe(50);
    expect(sallaApi.clampLimit(Number.NaN)).toBe(50);
    expect(sallaApi.clampLimit(undefined)).toBe(50);
    expect(sallaApi.clampLimit(12.9)).toBe(12);
    expect(sallaApi.clampLimit(99999)).toBe(1000);
  });

  it('keeps the caller query and encodes status arrays as status[]', async () => {
    const spy = mockPages([{ data: ids({ from: 1, count: 1 }) }]);
    await sallaApi.fetchPaged({ auth, path: '/orders', query: { status: [11, 22], keyword: 'abc', from_date: undefined }, maxItems: 10 });
    const url = urlsOf(spy)[0];
    expect(url.pathname).toBe('/admin/v2/orders');
    expect(url.searchParams.getAll('status[]')).toEqual(['11', '22']);
    expect(url.searchParams.get('keyword')).toBe('abc');
    expect(url.searchParams.has('from_date')).toBe(false);
    expect(url.searchParams.get('page')).toBe('1');
  });

  it('passes the fake sleep through to the 429 retry', async () => {
    let calls = 0;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      calls += 1;
      if (calls === 1) {
        throw new HttpError({}, { status: 429, responseBody: {} });
      }
      return { status: 200, headers: {}, body: { data: ids({ from: 1, count: 1 }) } };
    });
    const delays: number[] = [];
    const result = await sallaApi.fetchPaged({
      auth,
      path: '/x',
      maxItems: 10,
      sleep: async (ms) => {
        delays.push(ms);
      },
    });
    expect(result.items).toEqual(ids({ from: 1, count: 1 }));
    expect(delays).toEqual([2000]);
  });
});

describe('fetchPaged on a cursor shape that ignores page', () => {
  it('stops when a page repeats the previous first item instead of returning duplicates', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { status: 200, success: true, data: ids({ from: 1, count: 2 }), pagination: { count: 2, current: 1, next: 'opaque-cursor' } },
    });
    const result = await sallaApi.fetchPaged({ auth, path: '/payment/methods', maxItems: 100 });
    expect(result.items).toEqual(ids({ from: 1, count: 2 }));
    expect(result.truncated).toBe(false);
    expect(spy).toHaveBeenCalledTimes(2);
  });
});
