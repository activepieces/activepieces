import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { newCallCreatedPolling } from '../src/lib/triggers/new-call-created';

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => data.get(key) ?? null,
    put: async (key: string, value: unknown) => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function pageResponse({ page, pages, ids }: { page: number; pages: number; ids: string[] }) {
  return {
    status: 200,
    headers: {},
    body: {
      data: ids.map((id, i) => ({ uuid: id, created_at: new Date(Date.UTC(2030, 0, page, 0, i)).toISOString() })),
      pagination: { page, items: 100, count: ids.length, pages },
    },
  };
}

describe('new-call-created polling', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('sends page/items/order/from and stops at pagination.pages', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      const url = new URL(req.url);
      const page = Number(url.searchParams.get('page'));
      return pageResponse({ page, pages: 3, ids: [`p${page}-a`, `p${page}-b`] });
    });
    const result = await newCallCreatedPolling.items({
      auth: { username: 'id', password: 'secret' },
      store: makeStore(),
      propsValue: {},
      lastFetchEpochMS: 1700000000000,
    });
    expect(spy).toHaveBeenCalledTimes(3);
    const firstUrl = new URL(spy.mock.calls[0][0].url);
    expect(firstUrl.searchParams.get('items')).toBe('100');
    expect(firstUrl.searchParams.get('order')).toBe('created_at asc');
    expect(firstUrl.searchParams.get('date_filter')).toBe('created_at');
    expect(firstUrl.searchParams.get('from')).toBe(new Date(1700000000000).toISOString());
    expect(result).toHaveLength(6);
  });

  it('test mode fetches one page of 5 newest without from', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(pageResponse({ page: 1, pages: 9, ids: ['a'] }));
    await newCallCreatedPolling.items({
      auth: { username: 'id', password: 'secret' },
      store: makeStore(),
      propsValue: {},
      lastFetchEpochMS: 0,
    });
    expect(spy).toHaveBeenCalledTimes(1);
    const url = new URL(spy.mock.calls[0][0].url);
    expect(url.searchParams.get('items')).toBe('5');
    expect(url.searchParams.get('from')).toBeNull();
  });

  it('caps live polling at 20 pages', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (req) => {
      const page = Number(new URL(req.url).searchParams.get('page'));
      return pageResponse({ page, pages: 999, ids: [`p${page}`] });
    });
    await newCallCreatedPolling.items({
      auth: { username: 'id', password: 'secret' },
      store: makeStore(),
      propsValue: {},
      lastFetchEpochMS: 1700000000000,
    });
    expect(spy).toHaveBeenCalledTimes(20);
  });

  it('stops on an empty account (pages = 0)', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(pageResponse({ page: 1, pages: 0, ids: [] }));
    await newCallCreatedPolling.items({
      auth: { username: 'id', password: 'secret' },
      store: makeStore(),
      propsValue: {},
      lastFetchEpochMS: 1700000000000,
    });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
