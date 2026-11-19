import { httpClient, HttpError } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newBitlinkCreatedTrigger } from '../src/lib/triggers/new-bitlink-created';

const AUTH = { props: { accessToken: 'tok' } };

function makeStore({ initial = {} }: { initial?: Record<string, unknown> } = {}) {
  const data = new Map<string, unknown>(Object.entries(initial));
  return {
    data,
    store: {
      get: async (key: string) => data.get(key) ?? null,
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
  };
}

function call({ method, store, propsValue = {}, isRepublish = false }: { method: 'run' | 'test' | 'onEnable'; store: unknown; propsValue?: Record<string, unknown>; isRepublish?: boolean }): Promise<unknown> {
  const fn = newBitlinkCreatedTrigger[method];
  return Promise.resolve(
    Reflect.apply(fn, newBitlinkCreatedTrigger, [{ auth: AUTH, store, isRepublish, propsValue: { group_guid: 'Bg1', ...propsValue } }])
  );
}

function link({ id, at, archived = false }: { id: string; at: string; archived?: boolean }) {
  return { id, link: `https://${id}`, long_url: 'https://example.org', title: id, tags: [], archived, created_at: at };
}

function mockPages({ pages }: { pages: unknown[] }) {
  const spy = vi.spyOn(httpClient, 'sendRequest');
  for (const body of pages) {
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body });
  }
  return spy;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('new_bitlink_created', () => {
  it('onEnable stores a checkpoint from the newest link and emits nothing old', async () => {
    const { store, data } = makeStore();
    mockPages({ pages: [{ links: [link({ id: 'bit.ly/old', at: '2026-11-19T10:00:00+0000' })] }] });
    await call({ method: 'onEnable', store });
    expect(data.get('bitly-new-bitlink-state')).toMatchObject({ checkpoint: Date.parse('2026-11-19T10:00:00Z') / 1000 });
  });

  it('onEnable on republish with state does not call Bitly', async () => {
    const { store } = makeStore({ initial: { 'bitly-new-bitlink-state': { checkpoint: 1, seen: {} } } });
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await call({ method: 'onEnable', store, isRepublish: true });
    expect(spy).not.toHaveBeenCalled();
  });

  it('run pages past 100 links with search_after and emits each new link once, oldest first', async () => {
    const checkpoint = Date.parse('2026-11-19T10:00:00Z') / 1000;
    const { store, data } = makeStore({
      initial: { 'bitly-new-bitlink-state': { checkpoint, seen: { 'bit.ly/old': checkpoint } } },
    });
    const page1 = Array.from({ length: 100 }, (_, i) => link({ id: `bit.ly/n${i}`, at: `2026-11-19T11:${String(59 - (i % 60)).padStart(2, '0')}:00+0000` }));
    const spy = mockPages({
      pages: [
        { links: page1, pagination: { search_after: 'p2' } },
        { links: [link({ id: 'bit.ly/n100', at: '2026-11-19T10:30:00+0000' }), link({ id: 'bit.ly/old', at: '2026-11-19T10:00:00+0000' })], pagination: { search_after: '' } },
      ],
    });
    const out = await call({ method: 'run', store });
    expect(Array.isArray(out) ? out.length : 0).toBe(101);
    expect(spy.mock.calls[0][0].url).toContain(`created_after=${checkpoint - 120}`);
    expect(spy.mock.calls[1][0].url).toContain('search_after=p2');
    expect(Array.isArray(out) && out[0]).toMatchObject({ id: 'bit.ly/n100' });

    mockPages({ pages: [{ links: [link({ id: 'bit.ly/n0', at: '2026-11-19T11:59:00+0000' })] }] });
    expect(await call({ method: 'run', store })).toEqual([]);
    expect(data.get('bitly-new-bitlink-state')).toMatchObject({ checkpoint: Date.parse('2026-11-19T11:59:00Z') / 1000 });
  });

  it('stops at the page cap, emits the newest links and advances the checkpoint', async () => {
    const checkpoint = Date.parse('2026-11-19T00:00:00Z') / 1000;
    const { store, data } = makeStore({ initial: { 'bitly-new-bitlink-state': { checkpoint, seen: {} } } });
    const base = Date.parse('2026-11-19T10:00:00Z');
    const pages = Array.from({ length: 21 }, (_, p) => ({
      links: Array.from({ length: 100 }, (_, i) => {
        const n = p * 100 + i;
        return link({ id: `bit.ly/c${n}`, at: new Date(base - n * 1000).toISOString().replace('.000Z', '+0000') });
      }),
      pagination: { search_after: `p${p + 2}` },
    }));
    const spy = mockPages({ pages });
    const out = await call({ method: 'run', store });
    expect(spy).toHaveBeenCalledTimes(20);
    expect(Array.isArray(out) ? out.length : 0).toBe(2000);
    expect(data.get('bitly-new-bitlink-state')).toMatchObject({ checkpoint: base / 1000 });

    vi.restoreAllMocks();
    const again = mockPages({ pages: [{ links: [link({ id: 'bit.ly/fresh', at: '2026-11-19T10:01:00+0000' }), link({ id: 'bit.ly/c0', at: '2026-11-19T10:00:00+0000' }), link({ id: 'bit.ly/c50', at: '2026-11-19T09:59:10+0000' })] }] });
    const second = await call({ method: 'run', store });
    expect(again.mock.calls[0][0].url).toContain(`created_after=${base / 1000 - 120}`);
    expect(second).toMatchObject([{ id: 'bit.ly/fresh' }]);
  });

  it('keeps the previous checkpoint when a poll sees no links', async () => {
    const { store, data } = makeStore({ initial: { 'bitly-new-bitlink-state': { checkpoint: 1763546400, seen: {} } } });
    mockPages({ pages: [{ links: [] }] });
    expect(await call({ method: 'run', store })).toEqual([]);
    expect(data.get('bitly-new-bitlink-state')).toEqual({ checkpoint: 1763546400, seen: {} });
  });

  it('onEnable with no links stores checkpoint 0 and the next poll has no created_after filter', async () => {
    const { store, data } = makeStore();
    mockPages({ pages: [{ links: [] }] });
    await call({ method: 'onEnable', store });
    expect(data.get('bitly-new-bitlink-state')).toEqual({ checkpoint: 0, seen: {} });
    vi.restoreAllMocks();
    const spy = mockPages({ pages: [{ links: [link({ id: 'bit.ly/first', at: '2026-11-19T11:00:00+0000' })] }] });
    expect(await call({ method: 'run', store })).toMatchObject([{ id: 'bit.ly/first' }]);
    expect(spy.mock.calls[0][0].url).not.toContain('created_after');
  });

  it('does not save state when a later page fails', async () => {
    const initial = { checkpoint: 100, seen: {} };
    const { store, data } = makeStore({ initial: { 'bitly-new-bitlink-state': initial } });
    vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { links: [link({ id: 'bit.ly/a', at: '2026-11-19T11:00:00+0000' })], pagination: { search_after: 'p2' } } })
      .mockRejectedValueOnce(new HttpError({}, { status: 429, responseBody: { message: 'RATE_LIMIT_EXCEEDED' } }));
    await expect(call({ method: 'run', store })).rejects.toThrow('RATE_LIMIT_EXCEEDED');
    expect(data.get('bitly-new-bitlink-state')).toBe(initial);
  });

  it('archived links advance the checkpoint but are not emitted unless included', async () => {
    const { store } = makeStore({ initial: { 'bitly-new-bitlink-state': { checkpoint: 100, seen: {} } } });
    mockPages({ pages: [{ links: [link({ id: 'bit.ly/arch', at: '2026-11-19T11:00:00+0000', archived: true })] }] });
    expect(await call({ method: 'run', store })).toEqual([]);
  });

  it('migrates the legacy id list', async () => {
    const { store, data } = makeStore({ initial: { 'bitly-last-bitlink-ids': ['bit.ly/old'] } });
    mockPages({ pages: [{ links: [link({ id: 'bit.ly/new', at: '2026-11-19T11:00:00+0000' }), link({ id: 'bit.ly/old', at: '2026-11-19T10:00:00+0000' })] }] });
    const out = await call({ method: 'run', store });
    expect(out).toMatchObject([{ id: 'bit.ly/new' }]);
    expect(data.has('bitly-last-bitlink-ids')).toBe(false);
  });

  it('test() throws on auth errors instead of returning fake data', async () => {
    const { store } = makeStore();
    vi.spyOn(httpClient, 'sendRequest').mockRejectedValueOnce(new HttpError({}, { status: 401, responseBody: { message: 'FORBIDDEN' } }));
    await expect(call({ method: 'test', store })).rejects.toThrow('HTTP 401');
  });
});
