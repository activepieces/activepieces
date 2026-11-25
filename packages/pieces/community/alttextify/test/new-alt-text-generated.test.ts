import { describe, expect, it, vi, beforeEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { newAltTextGeneratedTrigger } from '../src/lib/triggers/new-alt-text-generated';

function makeStore({ initial }: { initial: Record<string, unknown> }) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    get: vi.fn(async (key: string) => data[key] ?? null),
    put: vi.fn(async (key: string, value: unknown) => {
      data[key] = value;
      return value;
    }),
    delete: vi.fn(async (key: string) => {
      delete data[key];
    }),
  };
}

function callTrigger({ method, store, isRepublish }: { method: 'onEnable'; store: ReturnType<typeof makeStore>; isRepublish: boolean }) {
  const context = { auth: { secret_text: 'key' }, store, propsValue: {}, isRepublish };
  return Reflect.apply(newAltTextGeneratedTrigger[method], undefined, [context]);
}

function runTrigger({ store }: { store: ReturnType<typeof makeStore> }) {
  const context = { auth: { secret_text: 'key' }, store, propsValue: {} };
  return Reflect.apply(newAltTextGeneratedTrigger.run, undefined, [context]);
}

const KEY = 'alttextify_new_alt_text_state';
const T1 = '2025-03-21T08:39:29.751Z';
const T2 = '2025-03-21T08:40:00.000Z';

describe('new-alt-text-generated', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('emits unseen items at the boundary timestamp and newer ones, oldest first', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: Date.parse(T1), seenIds: ['a'] } } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: [
        { asset_id: 'c', alt_text: ['c'], created_at: T2 },
        { asset_id: 'b', alt_text: ['b'], created_at: T1 },
        { asset_id: 'a', alt_text: ['a'], created_at: T1 },
      ],
    });
    const items = await runTrigger({ store });
    expect(items.map((item: { asset_id: string }) => item.asset_id)).toEqual(['b', 'c']);
    expect(store.data[KEY]).toEqual({ cursorMs: Date.parse(T2), seenIds: ['c'] });
  });

  it('keeps old boundary ids when the cursor does not move', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: Date.parse(T1), seenIds: ['a'] } } });
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: [
        { asset_id: 'b', alt_text: ['b'], created_at: T1 },
        { asset_id: 'a', alt_text: ['a'], created_at: T1 },
      ],
    });
    await runTrigger({ store });
    expect(store.data[KEY]).toEqual({ cursorMs: Date.parse(T1), seenIds: ['a', 'b'] });
  });

  it('does not write state when a page fails', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: 0, seenIds: [] } } });
    const fullPage = Array.from({ length: 100 }, (_, index) => ({
      asset_id: `id-${index}`,
      alt_text: ['x'],
      created_at: T2,
    }));
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: fullPage })
      .mockRejectedValueOnce(new Error('network down'));
    await expect(runTrigger({ store })).rejects.toThrow('network down');
    expect(store.put).not.toHaveBeenCalled();
  });

  it('caps one poll at 100 items', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: 0, seenIds: [] } } });
    const page = ({ offset, count }: { offset: number; count: number }) =>
      Array.from({ length: count }, (_, index) => ({
        asset_id: `id-${offset + index}`,
        alt_text: ['x'],
        created_at: new Date(Date.parse(T2) - (offset + index) * 1000).toISOString(),
      }));
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: page({ offset: 0, count: 100 }) })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: page({ offset: 100, count: 20 }) });
    const items = await runTrigger({ store });
    expect(items).toHaveLength(100);
    expect(items[0].asset_id).toBe('id-119');
  });

  it('loses nothing when more than 100 items share one timestamp across two polls', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: 0, seenIds: [] } } });
    const all = Array.from({ length: 150 }, (_, index) => ({
      asset_id: `same-${index}`,
      alt_text: ['x'],
      created_at: T2,
    }));
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const page = Number(request.queryParams?.['page'] ?? '1');
      return { status: 200, headers: {}, body: all.slice((page - 1) * 100, page * 100) };
    });
    const first = await runTrigger({ store });
    const second = await runTrigger({ store });
    const third = await runTrigger({ store });
    const ids = [...first, ...second].map((item: { asset_id: string }) => item.asset_id);
    expect(first).toHaveLength(100);
    expect(second).toHaveLength(50);
    expect(new Set(ids).size).toBe(150);
    expect(third).toHaveLength(0);
  });

  it('throws without writing state when the scan cap is hit before the cursor', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: 0, seenIds: [] } } });
    let call = 0;
    const send = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      const offset = call++ * 100;
      return {
        status: 200,
        headers: {},
        body: Array.from({ length: 100 }, (_, index) => ({
          asset_id: `id-${offset + index}`,
          alt_text: ['x'],
          created_at: new Date(Date.parse(T2) - (offset + index) * 1000).toISOString(),
        })),
      };
    });
    await expect(runTrigger({ store })).rejects.toThrow('More than 10,000 new AltTextify images');
    expect(send).toHaveBeenCalledTimes(100);
    expect(store.put).not.toHaveBeenCalled();
  });

  it('scans past 10 pages until it reaches the cursor', async () => {
    const store = makeStore({ initial: { [KEY]: { cursorMs: Date.parse(T1), seenIds: [] } } });
    let call = 0;
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async () => {
      const offset = call++ * 100;
      const body =
        call <= 12
          ? Array.from({ length: 100 }, (_, index) => ({
              asset_id: `id-${offset + index}`,
              alt_text: ['x'],
              created_at: new Date(Date.parse(T2) + 10_000_000 - (offset + index) * 1000).toISOString(),
            }))
          : [{ asset_id: 'old', alt_text: ['x'], created_at: '2025-03-21T08:00:00.000Z' }];
      return { status: 200, headers: {}, body };
    });
    const items = await runTrigger({ store });
    expect(call).toBe(13);
    expect(items).toHaveLength(100);
    expect(items[0].asset_id).toBe('id-1199');
  });

  it('keeps existing state on republish', async () => {
    const existing = { cursorMs: 123, seenIds: ['a'] };
    const store = makeStore({ initial: { [KEY]: existing } });
    const send = vi.spyOn(httpClient, 'sendRequest');
    await callTrigger({ method: 'onEnable', store, isRepublish: true });
    expect(send).not.toHaveBeenCalled();
    expect(store.data[KEY]).toEqual(existing);
  });

  it('seeds every id sharing the newest timestamp, across pages', async () => {
    const store = makeStore({ initial: {} });
    const fullPage = Array.from({ length: 100 }, (_, index) => ({ asset_id: `n-${index}`, alt_text: ['x'], created_at: T2 }));
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: fullPage })
      .mockResolvedValueOnce({
        status: 200,
        headers: {},
        body: [
          { asset_id: 'n-100', alt_text: ['x'], created_at: T2 },
          { asset_id: 'older', alt_text: ['x'], created_at: T1 },
        ],
      });
    await callTrigger({ method: 'onEnable', store, isRepublish: false });
    const state = store.data[KEY];
    expect(state).toMatchObject({ cursorMs: Date.parse(T2) });
    expect(state.seenIds).toHaveLength(101);
    expect(state.seenIds).not.toContain('older');
  });
});
