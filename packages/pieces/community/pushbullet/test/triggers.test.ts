import { httpClient } from '@activepieces/pieces-common';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { pushbullet } from '../src/index';
import { newPushTrigger } from '../src/lib/triggers/new-push';

const AUTH = { secret_text: 'o.tok' };

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async (k: string) => (data.has(k) ? data.get(k) : null),
    put: async (k: string, v: unknown) => {
      data.set(k, v);
      return v;
    },
    delete: async (k: string) => {
      data.delete(k);
    },
  };
}

function ctx({ store, propsValue = {} }: { store: ReturnType<typeof makeStore>; propsValue?: Record<string, unknown> }) {
  return { auth: AUTH, propsValue, store, files: {}, server: {}, setSchedule: () => undefined };
}

function push({ iden, createdSec, extra = {} }: { iden: string; createdSec: number; extra?: Record<string, unknown> }) {
  return { iden, type: 'note', active: true, dismissed: false, created: createdSec, modified: createdSec, ...extra };
}

function idens(out: unknown): unknown[] {
  if (!Array.isArray(out)) throw new Error('expected an array');
  return out.map((p: unknown) => (typeof p === 'object' && p !== null && 'iden' in p ? p.iden : undefined));
}

function keysOf(value: unknown): string[] {
  return typeof value === 'object' && value !== null ? Object.keys(value) : [];
}

function call({ fn, c }: { fn: unknown; c: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') throw new Error('not a function');
  return Promise.resolve(Reflect.apply(fn, newPushTrigger, [c]));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('new_push trigger', () => {
  it('outputSchema covers every sampleData key', () => {
    const t = pushbullet.triggers()['new_push'];
    const keys = t.outputSchema?.fields.map((f) => f.key) ?? [];
    for (const key of keysOf(t.sampleData)) {
      expect(keys, key).toContain(key);
    }
  });

  it('poll filters dismissed/inactive/old pushes, sends modified_after, and dedupes on created', async () => {
    const store = makeStore();
    const lastPoll = 1_700_000_000_000;
    store.data.set('lastPoll', lastPoll);
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: {
        pushes: [
          push({ iden: 'new', createdSec: 1_700_000_100 }),
          push({ iden: 'dismissed', createdSec: 1_700_000_090, extra: { dismissed: true } }),
          push({ iden: 'deleted', createdSec: 1_700_000_080, extra: { active: false } }),
          push({ iden: 'old-but-modified', createdSec: 1_699_999_000, extra: { modified: 1_700_000_050 } }),
        ],
      },
    });
    const out = await call({ fn: newPushTrigger.run, c: ctx({ store }) });
    expect(idens(out)).toEqual(['new']);
    expect(spy.mock.calls[0][0].queryParams).toEqual({ active: 'true', limit: '100', modified_after: '1700000000' });
    expect(store.data.get('lastPoll')).toBe(1_700_000_100_000);

    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: { pushes: [push({ iden: 'new', createdSec: 1_700_000_100 })] } });
    const again = await call({ fn: newPushTrigger.run, c: ctx({ store }) });
    expect(again).toEqual([]);
  });

  it('includeDismissed keeps dismissed pushes', async () => {
    const store = makeStore();
    store.data.set('lastPoll', 1_000);
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce({
      status: 200,
      headers: {},
      body: { pushes: [push({ iden: 'd', createdSec: 5, extra: { dismissed: true } })] },
    });
    const out = await call({ fn: newPushTrigger.run, c: ctx({ store, propsValue: { includeDismissed: true } }) });
    expect(idens(out)).toEqual(['d']);
  });

  it('follows the cursor across pages', async () => {
    const store = makeStore();
    store.data.set('lastPoll', 1_000);
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { pushes: [push({ iden: 'a', createdSec: 20 })], cursor: 'c2' } })
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { pushes: [push({ iden: 'b', createdSec: 10 })] } });
    const out = await call({ fn: newPushTrigger.run, c: ctx({ store }) });
    expect(idens(out)).toEqual(['a', 'b']);
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[1][0].queryParams?.['cursor']).toBe('c2');
  });

  it('stops after 10 pages even if the cursor never ends', async () => {
    const store = makeStore();
    store.data.set('lastPoll', 1_000);
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValue({ status: 200, headers: {}, body: { pushes: [], cursor: 'again' } });
    await call({ fn: newPushTrigger.run, c: ctx({ store }) });
    expect(spy).toHaveBeenCalledTimes(10);
  });

  it('test returns up to 5 recent pushes without modified_after or paging', async () => {
    const store = makeStore();
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { pushes: [push({ iden: 'x', createdSec: 1 })], cursor: 'more' },
    });
    const out = await call({ fn: newPushTrigger.test, c: ctx({ store }) });
    expect(idens(out)).toEqual(['x']);
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][0].queryParams).toEqual({ active: 'true', limit: '5' });
  });

  it('onEnable stores lastPoll without calling the API', async () => {
    const store = makeStore();
    const spy = vi.spyOn(httpClient, 'sendRequest');
    await call({ fn: newPushTrigger.onEnable, c: ctx({ store }) });
    expect(typeof store.data.get('lastPoll')).toBe('number');
    expect(spy).not.toHaveBeenCalled();
  });
});
