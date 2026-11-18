import { afterEach, describe, expect, it, vi } from 'vitest';
import { DynamicsCRMClient, ListRecordsParams } from '../src/lib/common/client';
import { PollConfig, PollStore, dynamicsPolling } from '../src/lib/common/polling';

type Row = { contactid: string; createdon: string; modifiedon: string };

function fakeEnvironment({ rows }: { rows: Row[] }) {
  const client = new DynamicsCRMClient({ hostUrl: 'orgx.crm.dynamics.com', accessToken: 't' });
  const calls: ListRecordsParams[] = [];
  vi.spyOn(client, 'listRecords').mockImplementation(async (params) => {
    calls.push(params);
    const [state, offsetText] = (params.nextLink ?? '').split('#');
    const query: ListRecordsParams = state ? JSON.parse(state) : params;
    const offset = Number(offsetText ?? 0);
    const match = /^(\w+) (ge|eq) (\S+)$/.exec(query.filter ?? '');
    const desc = (query.orderby ?? '').includes('desc');
    const filtered = rows
      .filter((row) => {
        if (!match) return true;
        const value = Date.parse(row[match[1] === 'createdon' ? 'createdon' : 'modifiedon']);
        const target = Date.parse(match[3]);
        return match[2] === 'ge' ? value >= target : value === target;
      })
      .sort((a, b) => {
        const column = (query.orderby ?? 'createdon').startsWith('modifiedon') ? 'modifiedon' : 'createdon';
        const diff = Date.parse(a[column]) - Date.parse(b[column]) || a.contactid.localeCompare(b.contactid);
        return desc ? -diff : diff;
      });
    const slice = filtered.slice(offset, offset + params.pageSize);
    const more = offset + params.pageSize < filtered.length;
    return {
      records: slice.map((row) => ({ ...row })),
      nextLink: more ? `${JSON.stringify(query)}#${offset + params.pageSize}` : null,
      hasMore: more,
    };
  });
  const data = new Map<string, unknown>();
  const store: PollStore = {
    get: async (key: string) => data.get(key) ?? null,
    put: async (key: string, value: unknown) => {
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
  return { client, store, calls, data };
}

function row({ id, at, modified }: { id: number; at: string; modified?: string }): Row {
  return { contactid: `id-${String(id).padStart(5, '0')}`, createdon: at, modifiedon: modified ?? at };
}

const CREATED: PollConfig = { entitySet: 'contacts', primaryId: 'contactid', column: 'createdon' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('dynamicsPolling', () => {
  it('emits nothing old on the first poll after enable, then each new row once', async () => {
    const rows = [row({ id: 1, at: '2026-11-14T09:00:00Z' }), row({ id: 2, at: '2026-11-14T09:00:00Z' })];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config: CREATED });
    expect(await dynamicsPolling.poll({ ...env, config: CREATED })).toEqual([]);
    rows.push(row({ id: 3, at: '2026-11-14T09:00:00Z' }), row({ id: 4, at: '2026-11-14T09:00:01Z' }));
    const second = await dynamicsPolling.poll({ ...env, config: CREATED });
    expect(second.map((r) => r['contactid'])).toEqual(['id-00003', 'id-00004']);
    expect(await dynamicsPolling.poll({ ...env, config: CREATED })).toEqual([]);
  });

  it('shapes generic trigger output with id, entity set and declared keys', async () => {
    const rows = [row({ id: 1, at: '2026-11-14T09:00:00Z' })];
    const env = fakeEnvironment({ rows });
    const result = await dynamicsPolling.test({ client: env.client, config: { ...CREATED, outputKeys: ['statecode'], addIdentity: true } });
    expect(result[0]).toEqual({ statecode: null, ...rows[0], id: 'id-00001', entitySet: 'contacts' });
  });

  it('keeps every row that shares the boundary timestamp across a page cap', async () => {
    const rows: Row[] = [];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config: CREATED });
    for (let i = 0; i < 1500; i++) {
      rows.push(row({ id: i, at: i < 1200 ? '2026-11-14T10:00:00Z' : '2026-11-14T10:00:05Z' }));
    }
    const first = await dynamicsPolling.poll({ ...env, config: CREATED });
    expect(first).toHaveLength(1200);
    rows.push(row({ id: 99999, at: '2026-11-14T10:00:00Z' }));
    const second = await dynamicsPolling.poll({ ...env, config: CREATED });
    const third = await dynamicsPolling.poll({ ...env, config: CREATED });
    const all = [...first, ...second, ...third].map((r) => r['contactid']);
    expect(new Set(all).size).toBe(all.length);
    expect(all).toHaveLength(1501);
  });

  it('skips unchanged new rows in the updated trigger but still advances past them', async () => {
    const config: PollConfig = { entitySet: 'contacts', primaryId: 'contactid', column: 'modifiedon', include: dynamicsPolling.changedAfterCreate };
    const rows: Row[] = [];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config });
    rows.push(row({ id: 1, at: '2026-11-14T11:00:00Z' }), row({ id: 2, at: '2026-11-14T10:00:00Z', modified: '2026-11-14T11:00:01Z' }));
    const first = await dynamicsPolling.poll({ ...env, config });
    expect(first.map((r) => r['contactid'])).toEqual(['id-00002']);
    rows[1].modifiedon = '2026-11-14T11:30:00Z';
    const second = await dynamicsPolling.poll({ ...env, config });
    expect(second.map((r) => r['contactid'])).toEqual(['id-00002']);
    expect(await dynamicsPolling.poll({ ...env, config })).toEqual([]);
  });

  it('does not write state when a poll request fails', async () => {
    const env = fakeEnvironment({ rows: [] });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config: CREATED });
    const before = await env.store.get('dynamics_poll_state');
    vi.spyOn(env.client, 'listRecords').mockRejectedValue(new Error('boom'));
    await expect(dynamicsPolling.poll({ ...env, config: CREATED })).rejects.toThrow('boom');
    expect(await env.store.get('dynamics_poll_state')).toEqual(before);
  });

  it('returns the latest five rows in test mode', async () => {
    const rows = Array.from({ length: 8 }, (_, i) => row({ id: i, at: `2026-11-14T09:00:0${i}Z` }));
    const env = fakeEnvironment({ rows });
    const result = await dynamicsPolling.test({ client: env.client, config: CREATED });
    expect(result.map((r) => r['contactid'])).toEqual(['id-00007', 'id-00006', 'id-00005', 'id-00004', 'id-00003']);
  });

  it('saves progress at the scan limit instead of throwing when filtered rows pile up', async () => {
    const config: PollConfig = { entitySet: 'contacts', primaryId: 'contactid', column: 'modifiedon', include: dynamicsPolling.changedAfterCreate };
    const rows: Row[] = [];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config });
    const base = Date.parse('2026-11-14T00:00:00Z');
    for (let i = 0; i < 25000; i++) {
      const at = new Date(base + i * 1000).toISOString().replace('.000Z', 'Z');
      rows.push(row({ id: i, at }));
    }
    expect(await dynamicsPolling.poll({ ...env, config })).toEqual([]);
    const after = Date.parse('2026-11-15T00:00:00Z');
    rows[10].modifiedon = new Date(after).toISOString().replace('.000Z', 'Z');
    const second = await dynamicsPolling.poll({ ...env, config });
    expect(second.map((r) => r['contactid'])).toEqual(['id-00010']);
    expect(await dynamicsPolling.poll({ ...env, config })).toEqual([]);
  });

  it('picks up rows committed late inside the look-back window, once', async () => {
    const rows = [row({ id: 1, at: '2026-11-14T12:00:00Z' })];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config: CREATED });
    rows.push(row({ id: 2, at: '2026-11-14T12:01:00Z' }));
    expect((await dynamicsPolling.poll({ ...env, config: CREATED })).map((r) => r['contactid'])).toEqual(['id-00002']);
    rows.push(row({ id: 3, at: '2026-11-14T12:00:30Z' }), row({ id: 4, at: '2026-11-14T11:58:00Z' }));
    expect((await dynamicsPolling.poll({ ...env, config: CREATED })).map((r) => r['contactid'])).toEqual(['id-00003']);
    expect(await dynamicsPolling.poll({ ...env, config: CREATED })).toEqual([]);
  });

  it('keeps the seen-ID state bounded', async () => {
    const rows: Row[] = [];
    const env = fakeEnvironment({ rows });
    await dynamicsPolling.onEnable({ client: env.client, store: env.store, config: CREATED });
    for (let i = 0; i < 8000; i++) {
      rows.push(row({ id: i, at: `2026-11-14T13:00:${String(i % 50).padStart(2, '0')}Z` }));
    }
    const emitted: unknown[] = [];
    for (let i = 0; i < 12; i++) {
      emitted.push(...(await dynamicsPolling.poll({ ...env, config: CREATED })).map((r) => r['contactid']));
    }
    expect(new Set(emitted).size).toBe(8000);
    expect(emitted).toHaveLength(8000);
    const state = await env.store.get('dynamics_poll_state');
    expect(state).toMatchObject({ watermark: '2026-11-14T13:00:49Z' });
    expect(JSON.stringify(state).length).toBeLessThan(400000);
  });

  it('upgrades the old idsAtWatermark state without re-emitting', async () => {
    const rows = [row({ id: 1, at: '2026-11-14T12:00:00Z' })];
    const env = fakeEnvironment({ rows });
    env.data.set('dynamics_poll_state', {
      entitySet: 'contacts',
      column: 'createdon',
      watermark: '2026-11-14T12:00:00Z',
      idsAtWatermark: ['id-00001'],
    });
    rows.push(row({ id: 2, at: '2026-11-14T12:00:00Z' }));
    expect((await dynamicsPolling.poll({ ...env, config: CREATED })).map((r) => r['contactid'])).toEqual(['id-00002']);
  });
});
