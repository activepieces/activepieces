import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newPublishedPost } from '../src/lib/triggers/new-published-post';
import { apiKeyAuth, installFetch, jsonResponse, legacyAuth, listBody, memoryStore, publishedPost, requestOf } from './helpers';

let fetchMock: ReturnType<typeof installFetch>;
const STORE_KEY = 'nuelink_new_published_post';

beforeEach(() => {
  fetchMock = installFetch();
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-11T12:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

function hookContext({ store, propsValue = { brand: 42, status: 'PUBLISHED' }, isRepublish, auth = apiKeyAuth() }: { store: ReturnType<typeof memoryStore>['store']; propsValue?: Record<string, unknown>; isRepublish?: boolean; auth?: ReturnType<typeof apiKeyAuth> | ReturnType<typeof legacyAuth> }) {
  return { auth, propsValue, store, isRepublish, setSchedule: () => undefined };
}

function call<K extends 'onEnable' | 'onDisable' | 'run' | 'test'>({ hook, context }: { hook: K; context: ReturnType<typeof hookContext> }): Promise<unknown> {
  const fn = newPublishedPost[hook];
  return Reflect.apply(fn, newPublishedPost, [context]);
}

function idsOf(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error('expected an array of emitted items');
  }
  return value.map((item: unknown) => (typeof item === 'object' && item !== null && 'id' in item ? item.id : undefined));
}

describe('New Published Post trigger', () => {
  it('onEnable seeds the seen set from the last 15 minutes and emits nothing', async () => {
    const { store, data } = memoryStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 10 }), publishedPost({ id: 11 })] }) }));
    await call({ hook: 'onEnable', context: hookContext({ store }) });
    const request = requestOf({ fetchMock, call: 0 });
    expect(request.path).toBe('/api/public/v1/brands/42/published-posts');
    expect(request.query).toEqual({ status: 'PUBLISHED', published_from: '2026-10-11 11:45:00', sort_by: 'id', sort_order: 'asc', page: '1', per_page: '100' });
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}')).toEqual({ seen: ['11', '10'], recent: [], lastPoll: Date.parse('2026-10-11T12:00:00Z') });
  });

  it('emits only unseen results and does not repeat them on the next overlapping poll', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: ['10'], lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 10 }), publishedPost({ id: 12 }), publishedPost({ id: 13 })] }) }));
    const first = await call({ hook: 'run', context: hookContext({ store, propsValue: { brand: 42, status: 'FAILED', collection: 77 } }) });
    expect(idsOf(first)).toEqual([12, 13]);
    expect(requestOf({ fetchMock, call: 0 }).query).toMatchObject({ status: 'FAILED', collection_id: '77', published_from: '2026-10-11 11:40:00' });

    vi.setSystemTime(new Date('2026-10-11T12:05:00Z'));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 12 }), publishedPost({ id: 13 }), publishedPost({ id: 14 })] }) }));
    const second = await call({ hook: 'run', context: hookContext({ store, propsValue: { brand: 42, status: 'FAILED', collection: 77 } }) });
    expect(idsOf(second)).toEqual([14]);
    expect(requestOf({ fetchMock, call: 1 }).query).toMatchObject({ published_from: '2026-10-11 11:45:00' });
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}').seen).toEqual(['14', '13', '12', '10']);
  });

  it('a late result with an old ID inside the overlap window still fires once', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: ['20', '21'], lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 5, publishedAt: '2026-10-11T11:54:00.000000Z' }), publishedPost({ id: 20 })] }) }));
    const emitted = await call({ hook: 'run', context: hookContext({ store }) });
    expect(idsOf(emitted)).toEqual([5]);
  });

  it('drains a backlog larger than 500 that shares one publishedAt across consecutive polls', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: [], lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    const backlog = Array.from({ length: 1234 }, (_, i) => publishedPost({ id: i + 1, publishedAt: '2026-10-11T11:50:00.000000Z' }));
    fetchMock.mockImplementation(async (input: string) => {
      const params = new URL(input).searchParams;
      const page = Number(params.get('page'));
      const perPage = Number(params.get('per_page'));
      const lastPage = Math.ceil(backlog.length / perPage);
      return jsonResponse({ body: listBody({ data: backlog.slice((page - 1) * perPage, page * perPage), currentPage: page, lastPage }) });
    });
    const emitted: unknown[] = [];
    const startedFrom: string[] = [];
    for (let poll = 0; poll < 6; poll++) {
      vi.setSystemTime(new Date(Date.parse('2026-10-11T12:00:00Z') + poll * 60_000));
      const before = fetchMock.mock.calls.length;
      emitted.push(...idsOf(await call({ hook: 'run', context: hookContext({ store }) })));
      startedFrom.push(new URL(String(fetchMock.mock.calls[before][0])).searchParams.get('page') ?? '');
    }
    expect(emitted).toEqual(backlog.map((item) => item.id));
    expect(startedFrom).toEqual(['1', '6', '11', '1', '6', '11']);
    const state = JSON.parse(data.get(STORE_KEY) ?? '{}');
    expect(state.resume).toBeUndefined();
    expect(state.recent).toEqual([[Date.parse('2026-10-11T11:50:00Z'), backlog.map((item) => String(item.id))]]);
    expect(state.lastPoll).toBe(Date.parse('2026-10-11T12:05:00Z'));

    vi.setSystemTime(new Date('2026-10-11T12:20:00Z'));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [] }) }));
    await expect(call({ hook: 'run', context: hookContext({ store }) })).resolves.toEqual([]);
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}').recent).toEqual([]);
  });

  it('keeps the window fixed while a capped batch is unfinished', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: [], lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    fetchMock.mockImplementation(async (input: string) => {
      const page = Number(new URL(input).searchParams.get('page'));
      return jsonResponse({ body: listBody({ data: [publishedPost({ id: page, publishedAt: `2026-10-11T11:4${page}:00.000000Z` })], currentPage: page, lastPage: 9 }) });
    });
    const emitted = await call({ hook: 'run', context: hookContext({ store }) });
    expect(fetchMock).toHaveBeenCalledTimes(5);
    expect(Array.isArray(emitted) ? emitted.length : -1).toBe(5);
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}')).toMatchObject({ lastPoll: Date.parse('2026-10-11T11:55:00Z'), resume: { since: Date.parse('2026-10-11T11:40:00Z'), page: 6 } });
  });

  it('keeps the saved state under the 512 KiB store limit at the recent-ID cap', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: [], lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    const ids = Array.from({ length: 25000 }, (_, i) => 1_000_000_000 + i);
    fetchMock.mockImplementation(async (input: string) => {
      const page = Number(new URL(input).searchParams.get('page'));
      const start = (page - 1) * 100;
      const slice = ids.slice(start, start + 100).map((id, i) => publishedPost({ id, publishedAt: `2026-10-11T11:50:${String((start + i) % 60).padStart(2, '0')}.000000Z` }));
      return jsonResponse({ body: listBody({ data: slice, currentPage: page, lastPage: 250 }) });
    });
    for (let poll = 0; poll < 50; poll++) {
      await call({ hook: 'run', context: hookContext({ store }) });
    }
    const raw = data.get(STORE_KEY) ?? '';
    const state = JSON.parse(raw);
    expect(state.recent.reduce((total: number, group: [number, string[]]) => total + group[1].length, 0)).toBe(20000);
    expect(new TextEncoder().encode(raw).length).toBeLessThan(512 * 1024 * 0.6);
  });

  it('stays under the 512 KiB store limit when every delivery has its own publish time', async () => {
    const { store, data } = memoryStore();
    const since = Date.parse('2026-10-11T06:00:00Z');
    data.set(STORE_KEY, JSON.stringify({ seen: [], lastPoll: since }));
    const ids = Array.from({ length: 25000 }, (_, i) => 100_000_000_000_000 + i);
    fetchMock.mockImplementation(async (input: string) => {
      const page = Number(new URL(input).searchParams.get('page'));
      const start = (page - 1) * 100;
      const slice = ids.slice(start, start + 100).map((id, i) => publishedPost({ id, publishedAt: new Date(since + (start + i) * 1000).toISOString() }));
      return jsonResponse({ body: listBody({ data: slice, currentPage: page, lastPage: 250 }) });
    });
    for (let poll = 0; poll < 40; poll++) {
      await call({ hook: 'run', context: hookContext({ store }) });
      expect(new TextEncoder().encode(data.get(STORE_KEY) ?? '').length).toBeLessThan(512 * 1024);
    }
    const state = JSON.parse(data.get(STORE_KEY) ?? '{}');
    const kept: string[] = state.recent.flatMap((group: [number, string[]]) => group[1]);
    expect(state.resume).toMatchObject({ page: 201 });
    expect(kept.length).toBeGreaterThan(10000);
    expect(kept[kept.length - 1]).toBe(String(ids[19999]));
  });

  it('keeps the seen set bounded', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, JSON.stringify({ seen: Array.from({ length: 1000 }, (_, i) => String(5000 - i)), lastPoll: Date.parse('2026-10-11T11:55:00Z') }));
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 9000 })] }) }));
    await call({ hook: 'run', context: hookContext({ store }) });
    const seen = JSON.parse(data.get(STORE_KEY) ?? '{}').seen;
    expect(seen).toHaveLength(1000);
    expect(seen[0]).toBe('9000');
  });

  it('a run without state seeds instead of emitting history', async () => {
    const { store, data } = memoryStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 1 })] }) }));
    await expect(call({ hook: 'run', context: hookContext({ store }) })).resolves.toEqual([]);
    expect(data.has(STORE_KEY)).toBe(true);
  });

  it('republish keeps the existing checkpoint', async () => {
    const { store, data } = memoryStore();
    const state = { seen: ['1'], lastPoll: 123 };
    data.set(STORE_KEY, JSON.stringify(state));
    await call({ hook: 'onEnable', context: hookContext({ store, isRepublish: true }) });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}')).toEqual(state);
  });

  it('a failing poll does not move the checkpoint', async () => {
    const { store, data } = memoryStore();
    const state = { seen: ['1'], lastPoll: Date.parse('2026-10-11T11:55:00Z') };
    data.set(STORE_KEY, JSON.stringify(state));
    fetchMock.mockResolvedValueOnce(jsonResponse({ status: 429, body: { message: 'Too Many Attempts.' } }));
    await expect(call({ hook: 'run', context: hookContext({ store }) })).rejects.toThrow('rate limit');
    expect(JSON.parse(data.get(STORE_KEY) ?? '{}')).toEqual(state);
  });

  it('test returns the five most recent results', async () => {
    const { store } = memoryStore();
    fetchMock.mockResolvedValueOnce(jsonResponse({ body: listBody({ data: [publishedPost({ id: 3 })] }) }));
    await expect(call({ hook: 'test', context: hookContext({ store }) })).resolves.toEqual([publishedPost({ id: 3 })]);
    expect(requestOf({ fetchMock, call: 0 }).query).toEqual({ status: 'PUBLISHED', sort_by: 'id', sort_order: 'desc', page: '1', per_page: '5' });
  });

  it('refuses the legacy token on enable', async () => {
    const { store } = memoryStore();
    await expect(call({ hook: 'onEnable', context: hookContext({ store, auth: legacyAuth() }) })).rejects.toThrow('needs a Nuelink API Key connection');
  });

  it('onDisable clears the state', async () => {
    const { store, data } = memoryStore();
    data.set(STORE_KEY, '{}');
    await call({ hook: 'onDisable', context: hookContext({ store }) });
    expect(data.has(STORE_KEY)).toBe(false);
  });
});
