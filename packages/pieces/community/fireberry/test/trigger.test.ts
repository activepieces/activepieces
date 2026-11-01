import { describe, expect, it, vi, afterEach } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { FireberryClient } from '../src/lib/common/client';
import { fireberryRecordPolling } from '../src/lib/triggers/record-created-updated.trigger';

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
