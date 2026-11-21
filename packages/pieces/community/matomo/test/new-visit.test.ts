import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { createMockPollingTriggerContext } from '../../../framework/src/lib/test';
import { newVisitTrigger } from '../src/lib/triggers/new-visit';

const auth = { type: AppConnectionType.CUSTOM_AUTH, props: { domain: 'http://localhost:8081', tokenAuth: 'abc123', siteId: '1' } };

afterEach(() => {
  vi.restoreAllMocks();
});

function memoryContext({ initial }: { initial: Record<string, unknown> }) {
  const data: Record<string, unknown> = { ...initial };
  const base = createMockPollingTriggerContext<typeof newVisitTrigger.props>({ propsValue: { siteId: undefined } });
  return {
    data,
    ctx: {
      ...base,
      auth,
      store: {
        put: async <T>(key: string, value: T) => {
          data[key] = value;
          return value;
        },
        get: async <T>(key: string): Promise<T | null> => {
          const value = data[key];
          return value === undefined ? null : readAs<T>({ value });
        },
        delete: async (key: string) => {
          delete data[key];
        },
      },
    },
  };
}

function readAs<T>({ value }: { value: unknown }): T {
  return JSON.parse(JSON.stringify(value));
}

function bodyOf({ body }: { body: unknown }) {
  return Object.fromEntries(new URLSearchParams(String(body)));
}

function visit({ id, ts }: { id: number; ts: number }) {
  return { idVisit: id, firstActionTimestamp: ts, serverTimestamp: ts };
}

const KEY = 'matomo_new_visit_state';

describe('New Visit trigger', () => {
  it('queries with a safety margin and emits only ids above the checkpoint, including late visits', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(50000 * 1000);
    const { ctx, data } = memoryContext({ initial: { [KEY]: { lastIdVisit: 10, lastTimestamp: 40000 } } });
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: [visit({ id: 9, ts: 39000 }), visit({ id: 10, ts: 40000 }), visit({ id: 12, ts: 30000 }), visit({ id: 11, ts: 40100 })],
    });
    const result = await newVisitTrigger.run(ctx);
    expect(result.map((v) => v['idVisit'])).toEqual([11, 12]);
    expect(bodyOf({ body: spy.mock.calls[0][0].body })).toMatchObject({
      method: 'Live.getLastVisitsDetails',
      idSite: '1',
      minTimestamp: String(40000 - 4 * 60 * 60),
      filter_sort_order: 'asc',
      filter_limit: '100',
      filter_offset: '0',
    });
    expect(data[KEY]).toEqual({ lastIdVisit: 12, lastTimestamp: 50000 });
  });

  it('does not emit duplicates across two polls', async () => {
    const { ctx } = memoryContext({ initial: { [KEY]: { lastIdVisit: 0, lastTimestamp: 100 } } });
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: [visit({ id: 5, ts: 110 })] });
    expect((await newVisitTrigger.run(ctx)).map((v) => v['idVisit'])).toEqual([5]);
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: [visit({ id: 5, ts: 110 }), visit({ id: 6, ts: 110 })] });
    expect((await newVisitTrigger.run(ctx)).map((v) => v['idVisit'])).toEqual([6]);
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: [visit({ id: 5, ts: 120 }), visit({ id: 6, ts: 110 })] });
    expect(await newVisitTrigger.run(ctx)).toEqual([]);
  });

  it('pages until a short page', async () => {
    const { ctx } = memoryContext({ initial: { [KEY]: { lastIdVisit: 0, lastTimestamp: 0 } } });
    const full = Array.from({ length: 100 }, (_, i) => visit({ id: i + 1, ts: 10 + i }));
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: full });
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: [visit({ id: 101, ts: 500 })] });
    const result = await newVisitTrigger.run(ctx);
    expect(result.length).toBe(101);
    expect(bodyOf({ body: spy.mock.calls[1][0].body })).toMatchObject({ filter_offset: '100' });
  });

  it('leaves state unchanged when a later page fails', async () => {
    const { ctx, data } = memoryContext({ initial: { [KEY]: { lastIdVisit: 3, lastTimestamp: 100 } } });
    const full = Array.from({ length: 100 }, (_, i) => visit({ id: i + 4, ts: 100 + i }));
    const spy = vi.spyOn(httpClient, 'sendRequest');
    spy.mockResolvedValueOnce({ status: 200, headers: {}, body: full });
    spy.mockRejectedValueOnce(new Error('down'));
    await expect(newVisitTrigger.run(ctx)).rejects.toThrow('Matomo Live.getLastVisitsDetails failed');
    expect(data[KEY]).toEqual({ lastIdVisit: 3, lastTimestamp: 100 });
  });

  it('seeds the checkpoint from the newest visit on enable', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(7000 * 1000);
    const { ctx, data } = memoryContext({ initial: {} });
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: [visit({ id: 42, ts: 6900 })] });
    await newVisitTrigger.onEnable(ctx);
    expect(bodyOf({ body: spy.mock.calls[0][0].body })).toMatchObject({ filter_limit: '1', filter_sort_order: 'desc' });
    expect(data[KEY]).toEqual({ lastIdVisit: 42, lastTimestamp: 7000 });
  });
  it('continues a capped poll from a cursor and emits every visit exactly once without stalling', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(20000 * 1000);
    const dataset = Array.from({ length: 1500 }, (_, i) => visit({ id: i + 1, ts: 19000 }));
    const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const form = bodyOf({ body: request.body });
      const offset = Number(form['filter_offset']);
      const limit = Number(form['filter_limit']);
      return { status: 200, headers: {}, body: dataset.slice(offset, offset + limit) };
    });
    const { ctx, data } = memoryContext({ initial: { [KEY]: { lastIdVisit: 0, lastTimestamp: 19500 } } });
    const first = await newVisitTrigger.run(ctx);
    expect(first.length).toBe(1000);
    expect(data[KEY]).toMatchObject({ lastIdVisit: 0, lastTimestamp: 19500, cursor: { nextOffset: 900, minTimestamp: 19500 - 4 * 60 * 60 } });
    const second = await newVisitTrigger.run(ctx);
    expect(second.map((v) => v['idVisit'])).toEqual(Array.from({ length: 500 }, (_, i) => i + 1001));
    expect(bodyOf({ body: spy.mock.calls[10][0].body })).toMatchObject({ filter_offset: '900', minTimestamp: String(19500 - 4 * 60 * 60) });
    expect(data[KEY]).toEqual({ lastIdVisit: 1500, lastTimestamp: 20000 });
    expect(await newVisitTrigger.run(ctx)).toEqual([]);
  });

  it('does not advance lastIdVisit on a capped poll', async () => {
    const dataset = Array.from({ length: 1000 }, (_, i) => visit({ id: 5000 - i, ts: 100 + i }));
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
      const form = bodyOf({ body: request.body });
      const offset = Number(form['filter_offset']);
      return { status: 200, headers: {}, body: dataset.slice(offset, offset + Number(form['filter_limit'])) };
    });
    const { ctx, data } = memoryContext({ initial: { [KEY]: { lastIdVisit: 10, lastTimestamp: 100 } } });
    await newVisitTrigger.run(ctx);
    expect(data[KEY]).toMatchObject({ lastIdVisit: 10, lastTimestamp: 100 });
  });
});
