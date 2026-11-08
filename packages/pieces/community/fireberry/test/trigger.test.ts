import { describe, expect, it, vi, afterEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { FireberryClient } from '../src/lib/common/client';
import { fireberryRecordPolling, recordCreatedOrUpdatedTrigger } from '../src/lib/triggers/record-created-updated.trigger';

afterEach(() => {
  vi.restoreAllMocks();
});

const rec = (id: string, modifiedon: string, createdon = '2026-01-01T00:00:00.000') => ({ accountid: id, modifiedon, createdon });

describe('selectNewRecords', () => {
  it('keeps time precision and does not re-emit records at the cursor', () => {
    const cursor = { timestamp: '2026-11-01T10:00:00.000', ids: ['a'] };
    const records = [rec('old', '2026-11-01T09:59:59.000'), rec('a', '2026-11-01T10:00:00.000'), rec('b', '2026-11-01T10:00:00.000'), rec('c', '2026-11-01T10:05:00.000')];
    const result = fireberryRecordPolling.selectNewRecords({ records, cursor, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' });
    expect(result.items.map((r) => r.accountid)).toEqual(['b', 'c']);
    expect(result.cursor).toEqual({ timestamp: '2026-11-01T10:05:00.000', ids: ['c'] });
  });

  it('emits nothing on a second poll over the same data', () => {
    const records = [rec('a', '2026-11-01T10:00:00.000'), rec('b', '2026-11-01T10:01:00.000')];
    const first = fireberryRecordPolling.selectNewRecords({ records, cursor: { timestamp: '2026-11-01T09:00:00.000', ids: [] }, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' });
    expect(first.items).toHaveLength(2);
    const second = fireberryRecordPolling.selectNewRecords({ records, cursor: first.cursor, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' });
    expect(second.items).toHaveLength(0);
  });

  it('emits a record again when it is modified later', () => {
    const cursor = { timestamp: '2026-11-01T10:00:00.000', ids: ['a'] };
    const result = fireberryRecordPolling.selectNewRecords({ records: [rec('a', '2026-11-01T11:00:00.000')], cursor, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' });
    expect(result.items).toHaveLength(1);
  });

  it('updated-only skips records whose createdon equals modifiedon but still advances the cursor', () => {
    const records = [rec('new', '2026-11-01T10:00:00.000', '2026-11-01T10:00:00.000'), rec('upd', '2026-11-01T10:01:00.000')];
    const result = fireberryRecordPolling.selectNewRecords({ records, cursor: null, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'updated' });
    expect(result.items.map((r) => r.accountid)).toEqual(['upd']);
    expect(result.cursor?.timestamp).toBe('2026-11-01T10:01:00.000');
  });
});

describe('ids and timestamps', () => {
  it('throws instead of collapsing a missing primary key to an empty id', () => {
    expect(() => fireberryRecordPolling.selectNewRecords({ records: [{ modifiedon: '2026-11-01T10:00:00.000' }], cursor: null, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' })).toThrow('primary key');
    expect(() => fireberryRecordPolling.selectNewRecords({ records: [rec('a', '2026-11-01T10:00:00.000')], cursor: null, field: 'modifiedon', primaryKey: '', triggerType: 'both' })).toThrow('primary key');
  });

  it('formats the query timestamp unquoted, seconds precision, no Z or conversion', () => {
    expect(fireberryRecordPolling.toQueryTimestamp('2026-11-01T15:20:57.957')).toBe('2026-11-01T15:20:57');
    expect(() => fireberryRecordPolling.toQueryTimestamp('01/11/2026')).toThrow();
  });
});

describe('updated-only tolerance', () => {
  it('treats modifiedon within 2s of createdon as a create, not an update', () => {
    const records = [
      rec('fresh', '2026-11-01T15:20:58.412', '2026-11-01T15:20:57.957'),
      rec('edited', '2026-11-01T15:25:10.100', '2026-11-01T15:20:57.957'),
    ];
    const result = fireberryRecordPolling.selectNewRecords({ records, cursor: null, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'updated' });
    expect(result.items.map((r) => r.accountid)).toEqual(['edited']);
    expect(result.cursor?.timestamp).toBe('2026-11-01T15:25:10.100');
  });
});

describe('first-poll tie handling', () => {
  it('keeps every id at the tied newest timestamp so the first poll emits nothing', () => {
    const ts = '2026-11-01T15:20:57.957';
    const records = ['a', 'b', 'c', 'd'].map((id) => rec(id, ts));
    const cursor = fireberryRecordPolling.cursorFromNewest({ records, field: 'modifiedon', primaryKey: 'accountid' });
    expect(cursor).toEqual({ timestamp: ts, ids: ['a', 'b', 'c', 'd'] });
    const poll = fireberryRecordPolling.selectNewRecords({ records, cursor, field: 'modifiedon', primaryKey: 'accountid', triggerType: 'both' });
    expect(poll.items).toHaveLength(0);
  });
});

describe('fetchSince', () => {
  it('pages beyond 50 records and sends the full timestamp', async () => {
    const page = (n: number, last: boolean) => ({
      status: 200,
      headers: {},
      body: { success: true, data: { PrimaryKey: 'accountid', IsLastPage: last, Data: Array.from({ length: last ? 3 : 50 }, (_, i) => rec(`${n}-${i}`, '2026-11-01T10:00:00.000')) } },
    });
    const spy = vi
      .spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce({ status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } })
      .mockResolvedValueOnce(page(1, false))
      .mockResolvedValueOnce(page(2, true));
    const result = await fireberryRecordPolling.fetchSince({ client: new FireberryClient('t'), objectSystemName: 'Account', field: 'modifiedon', since: '2026-11-01T09:30:15.123' });
    expect(result.records).toHaveLength(53);
    expect(result.primaryKey).toBe('accountid');
    expect(spy.mock.calls[1][0].body).toMatchObject({ objecttype: 1, query: '(modifiedon >= 2026-11-01T09:30:15)', sort_type: 'asc', page_number: 1 });
    expect(spy.mock.calls[2][0].body).toMatchObject({ page_number: 2 });
  });

  it('propagates API errors instead of returning an empty list', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 401, headers: {}, body: { Message: 'Unauthorized' } });
    await expect(fireberryRecordPolling.fetchSince({ client: new FireberryClient('t'), objectSystemName: 'Account', field: 'modifiedon', since: null })).rejects.toMatchObject({ status: 401 });
  });
});

function fakeFireberry(dataset: Record<string, unknown>[]) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    if (request.url.includes('/metadata/records')) {
      return { status: 200, headers: {}, body: { success: true, data: [{ name: 'Account', systemName: 'Account', objectType: '1' }] } };
    }
    const body = request.body as { query?: string; sort_type: string; page_size: number; page_number: number };
    if (body.page_number > 10) {
      return { status: 400, headers: {}, body: { success: false, Message: 'page_number cannot exceed 10' } };
    }
    const second = body.query ? /(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/.exec(body.query)?.[1] ?? '' : '';
    const filtered = dataset.filter((r) => String(r['modifiedon']).slice(0, 19) >= second);
    const sorted = body.sort_type === 'desc' ? [...filtered].reverse() : filtered;
    const start = (body.page_number - 1) * body.page_size;
    const Data = sorted.slice(start, start + body.page_size);
    return { status: 200, headers: {}, body: { success: true, data: { PrimaryKey: 'accountid', IsLastPage: start + body.page_size >= sorted.length, Data } } };
  });
}

function pageNumbers(spy: ReturnType<typeof fakeFireberry>): number[] {
  return spy.mock.calls
    .map(([request]) => request.body)
    .filter((body): body is { page_number: number } => typeof body === 'object' && body !== null && 'page_number' in body)
    .map((body) => body.page_number);
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    get: async <T>(key: string): Promise<T | null> => (data.has(key) ? structuredClone(data.get(key)) : null) as T | null,
    put: async <T>(key: string, value: T): Promise<T> => {
      data.set(key, structuredClone(value));
      return value;
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

describe('bulk records inside one second (Fireberry serves at most 10 pages)', () => {
  const ts = '2026-11-01T10:00:00.500';
  const start = { timestamp: '2026-11-01T10:00:00.000', ids: [] as string[] };
  const poll = (client: FireberryClient, cursor: Parameters<typeof fireberryRecordPolling.pollOnce>[0]['cursor']) =>
    fireberryRecordPolling.pollOnce({ client, objectSystemName: 'Account', field: 'modifiedon', cursor, triggerType: 'both' });

  it('never asks for page 11 or later', async () => {
    const spy = fakeFireberry(Array.from({ length: 600 }, (_, i) => rec(`r${i}`, ts)));
    await poll(new FireberryClient('t'), start);
    expect(Math.max(...pageNumbers(spy))).toBe(10);
  });

  it('more than 500 records in the cursor second: emits the 500 it can read and moves the cursor to the next second', async () => {
    const dataset = [...Array.from({ length: 600 }, (_, i) => rec(`r${i}`, ts)), rec('later', '2026-11-01T10:00:05.000')];
    fakeFireberry(dataset);
    const client = new FireberryClient('t');
    const first = await poll(client, start);
    expect(first.items).toHaveLength(500);
    expect(first.cursor).toEqual({ timestamp: '2026-11-01T10:00:01', ids: [], skippedSecond: '2026-11-01T10:00:00' });
    const second = await poll(client, first.cursor);
    expect(second.items.map((r) => r.accountid)).toEqual(['later']);
    const third = await poll(client, second.cursor);
    expect(third.items).toHaveLength(0);
  });

  it('500 full pages that end in a newer second return normally and the next poll continues from there', async () => {
    const dataset = [...Array.from({ length: 499 }, (_, i) => rec(`r${i}`, ts)), ...Array.from({ length: 30 }, (_, i) => rec(`n${i}`, '2026-11-01T10:00:05.000'))];
    fakeFireberry(dataset);
    const client = new FireberryClient('t');
    const first = await poll(client, start);
    expect(first.items).toHaveLength(500);
    expect(first.cursor?.skippedSecond).toBeUndefined();
    expect(first.cursor?.timestamp).toBe('2026-11-01T10:00:05.000');
    const second = await poll(client, first.cursor);
    expect(second.items).toHaveLength(29);
    const emitted = [...first.items, ...second.items].map((r) => r.accountid);
    expect(new Set(emitted).size).toBe(529);
  });

  it('nextSecond rolls over minutes and days', () => {
    expect(fireberryRecordPolling.nextSecond('2026-12-31T23:59:59')).toBe('2027-01-01T00:00:00');
  });
});

describe('latestCursor with many tied records', () => {
  it('records all 120 ids tied at the newest timestamp so the first poll emits 0', async () => {
    const ts = '2026-11-01T10:00:00.500';
    const dataset = [rec('older', '2026-11-01T09:00:00.000'), ...Array.from({ length: 120 }, (_, i) => rec(`t${i}`, ts))];
    fakeFireberry(dataset);
    const client = new FireberryClient('t');
    const cursor = await fireberryRecordPolling.latestCursor({ client, objectSystemName: 'Account', field: 'modifiedon' });
    expect(cursor?.timestamp).toBe(ts);
    expect(cursor?.ids).toHaveLength(120);
    const poll = await fireberryRecordPolling.pollOnce({ client, objectSystemName: 'Account', field: 'modifiedon', cursor, triggerType: 'both' });
    expect(poll.items).toHaveLength(0);
  });

  it('more than 500 existing records in the newest second: starts after that second, stays within 10 pages, first poll emits 0', async () => {
    const ts = '2026-11-01T10:00:00.500';
    const spy = fakeFireberry(Array.from({ length: 600 }, (_, i) => rec(`t${i}`, ts)));
    const client = new FireberryClient('t');
    const cursor = await fireberryRecordPolling.latestCursor({ client, objectSystemName: 'Account', field: 'modifiedon' });
    expect(cursor).toEqual({ timestamp: '2026-11-01T10:00:01', ids: [] });
    const poll = await fireberryRecordPolling.pollOnce({ client, objectSystemName: 'Account', field: 'modifiedon', cursor, triggerType: 'both' });
    expect(poll.items).toHaveLength(0);
    expect(Math.max(...pageNumbers(spy))).toBeLessThanOrEqual(10);
  });
});

describe('trigger lifecycle', () => {
  const auth = { type: 'SECRET_TEXT', secret_text: 't' };
  const propsValue = { objectType: 'Account', triggerType: 'both' };
  const ts = '2026-11-01T10:00:00.500';

  it('republish on self-hosted (onDisable without isRepublish, then onEnable with isRepublish) keeps the cursor', async () => {
    const dataset = [rec('a', ts)];
    fakeFireberry(dataset);
    const store = memoryStore();
    await recordCreatedOrUpdatedTrigger.onEnable({ auth, propsValue, store, isRepublish: false });
    const cursorBefore = store.data.get('fireberry_record_cursor');
    dataset.push(rec('b', '2026-11-01T10:05:00.000'));
    await recordCreatedOrUpdatedTrigger.onDisable({ auth, propsValue, store });
    await recordCreatedOrUpdatedTrigger.onEnable({ auth, propsValue, store, isRepublish: true });
    expect(store.data.get('fireberry_record_cursor')).toEqual(cursorBefore);
    const items = await recordCreatedOrUpdatedTrigger.run({ auth, propsValue, store });
    expect(items.map((r: Record<string, unknown>) => r['accountid'])).toEqual(['b']);
  });

  it('turning the flow off and on again resets the cursor to the newest record', async () => {
    const dataset = [rec('a', ts)];
    fakeFireberry(dataset);
    const store = memoryStore();
    await recordCreatedOrUpdatedTrigger.onEnable({ auth, propsValue, store, isRepublish: false });
    dataset.push(rec('b', '2026-11-01T10:05:00.000'));
    await recordCreatedOrUpdatedTrigger.onDisable({ auth, propsValue, store });
    await recordCreatedOrUpdatedTrigger.onEnable({ auth, propsValue, store, isRepublish: false });
    expect(store.data.get('fireberry_record_cursor')).toEqual({ cursor: { timestamp: '2026-11-01T10:05:00.000', ids: ['b'] } });
  });

  it('after a poll that skipped part of a second, the next run fails once with a clear error, then polling resumes', async () => {
    const dataset = [...Array.from({ length: 600 }, (_, i) => rec(`r${i}`, ts))];
    fakeFireberry(dataset);
    const store = memoryStore();
    await store.put('fireberry_record_cursor', { cursor: { timestamp: '2026-11-01T10:00:00.000', ids: [] } });
    const first = await recordCreatedOrUpdatedTrigger.run({ auth, propsValue, store });
    expect(first).toHaveLength(500);
    await expect(recordCreatedOrUpdatedTrigger.run({ auth, propsValue, store })).rejects.toThrow(/More than 500 Fireberry records share the modifiedon second 2026-11-01T10:00:00/);
    dataset.push(rec('later', '2026-11-01T10:00:05.000'));
    const third = await recordCreatedOrUpdatedTrigger.run({ auth, propsValue, store });
    expect(third.map((r: Record<string, unknown>) => r['accountid'])).toEqual(['later']);
  });
});
