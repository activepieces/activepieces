import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { pollingHelper } from '@activepieces/pieces-common';
import { FilesService, Store } from '@activepieces/pieces-framework';
import { FreshsalesApiError, freshsalesClient } from '../src/lib/common/client';
import { freshsalesPolling } from '../src/lib/common/record-polling';

const auth = { username: 'acme', password: 'key' };
const CHECKPOINT = Date.parse('2026-10-01T00:00:00Z');
const VIEW_KEY = 'freshsales_default_view_contacts';

describe('freshsales buildPolling', () => {
  let source: FakeSource;

  beforeEach(() => {
    source = createSource();
    vi.spyOn(freshsalesClient, 'request').mockImplementation(async ({ path, query }) =>
      source.handle({ path, query: query ?? {} })
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('emits every record of a backlog larger than 1,000 exactly once across polls', async () => {
    source.records.push(...makeRecords({ count: 2500, startId: 1, secondsPerRecord: 1 }));
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const emitted = await pollUntilIdle({ store });

    expect(emitted.flat().length).toBe(2500);
    expect(new Set(emitted.flat()).size).toBe(2500);
    expect(emitted.length).toBeGreaterThan(2);
  });

  it('never splits records that share the same second between two polls', async () => {
    source.records.push(...makeRecords({ count: 2500, startId: 1, secondsPerRecord: 1, perSecond: 7 }));
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const emitted = await pollUntilIdle({ store });

    expect(new Set(emitted.flat()).size).toBe(2500);
    expect(emitted.flat().length).toBe(2500);
    const pollBySecond = new Map<number, number>();
    emitted.forEach((ids, pollIndex) => {
      for (const id of ids) {
        const second = source.epochOf(id);
        const seenIn = pollBySecond.get(second);
        expect(seenIn === undefined || seenIn === pollIndex).toBe(true);
        pollBySecond.set(second, pollIndex);
      }
    });
  });

  it('keeps the checkpoint across polls and picks up records created while a backlog drains', async () => {
    source.records.push(...makeRecords({ count: 1500, startId: 1, secondsPerRecord: 1 }));
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const first = await pollIds({ store });
    const checkpointAfterFirst = await store.get<number>('lastPoll');
    expect(checkpointAfterFirst).toBe(Math.max(...first.map((id) => source.epochOf(id))));

    source.records.push(...makeRecords({ count: 50, startId: 100000, secondsPerRecord: 1, offsetSeconds: 5000 }));
    const rest = await pollUntilIdle({ store });

    const all = [...first, ...rest.flat()];
    expect(all.length).toBe(1550);
    expect(new Set(all).size).toBe(1550);
    expect(await store.get<number>('lastPoll')).toBe(source.epochOf(100049));
    expect(await pollIds({ store })).toEqual([]);
  });

  it('known limitation: more than 1,000 records in the same second emits only the oldest 1,000 and skips the rest', async () => {
    source.records.push(...makeRecords({ count: 1200, startId: 1, secondsPerRecord: 1, perSecond: 1200 }));
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const emitted = await pollUntilIdle({ store });

    expect(emitted.flat().length).toBe(1000);
    expect(new Set(emitted.flat()).size).toBe(1000);
  });

  it('uses the exact system view name over another view that starts with "All"', async () => {
    source.filters = [
      { id: 10, name: 'My Contacts' },
      { id: 11, name: 'All my open contacts' },
      { id: 12, name: 'All Contacts' },
    ];
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    await pollIds({ store });

    expect(source.viewIdsRequested).toEqual(['12']);
    expect(await store.get<string>(VIEW_KEY)).toBe('12');
  });

  it('falls back to the first view starting with "All" when the system name is missing', async () => {
    source.filters = [
      { id: 10, name: 'My Contacts' },
      { id: 11, name: 'All my open contacts' },
    ];
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    await pollIds({ store });

    expect(source.viewIdsRequested).toEqual(['11']);
  });

  it('caches the view id so later polls skip the filters request', async () => {
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    await pollIds({ store });
    await pollIds({ store });

    expect(source.filterRequests).toBe(1);
    expect(source.viewIdsRequested).toEqual(['12', '12']);
  });

  it('looks the view up again when the cached view id returns 404', async () => {
    source.records.push(...makeRecords({ count: 3, startId: 1, secondsPerRecord: 1 }));
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);
    await store.put(VIEW_KEY, '99');

    const ids = await pollIds({ store });

    expect(ids.length).toBe(3);
    expect(source.filterRequests).toBe(1);
    expect(source.viewIdsRequested).toEqual(['99', '12']);
    expect(await store.get<string>(VIEW_KEY)).toBe('12');
  });

  async function pollIds({ store }: { store: Store }): Promise<number[]> {
    const items = await pollingHelper.poll(polling, { store, auth, propsValue: {}, files });
    return items.map((item) => Number(readId(item)));
  }

  async function pollUntilIdle({ store }: { store: Store }): Promise<number[][]> {
    const polls: number[][] = [];
    for (let round = 0; round < 50; round++) {
      const ids = await pollIds({ store });
      if (ids.length === 0) {
        return polls;
      }
      polls.push(ids);
    }
    throw new Error('Polling did not settle.');
  }
});

const polling = freshsalesPolling.buildPolling({ entity: 'contacts', timestampField: 'created_at' });

const files: FilesService = {
  write: async () => '',
  upload: async () => '',
};

function createStore(): Store {
  const data = new Map<string, unknown>();
  return {
    put: async <T>(key: string, value: T) => {
      data.set(key, value);
      return value;
    },
    get: async <T>(key: string) => {
      const value: unknown = data.get(key);
      return value === undefined ? null : readStored<T>(value);
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function readStored<T>(value: unknown): T {
  return JSON.parse(JSON.stringify(value));
}

function readId(item: unknown): unknown {
  return typeof item === 'object' && item !== null && 'id' in item ? item.id : undefined;
}

function makeRecords({
  count,
  startId,
  secondsPerRecord,
  perSecond = 1,
  offsetSeconds = 0,
}: {
  count: number;
  startId: number;
  secondsPerRecord: number;
  perSecond?: number;
  offsetSeconds?: number;
}): FakeRecord[] {
  return Array.from({ length: count }, (_, index) => ({
    id: startId + index,
    created_at: new Date(
      CHECKPOINT + (offsetSeconds + 1 + Math.floor(index / perSecond) * secondsPerRecord) * 1000
    ).toISOString(),
  }));
}

function createSource(): FakeSource {
  const source: FakeSource = {
    records: [],
    filters: [
      { id: 10, name: 'My Contacts' },
      { id: 12, name: 'All Contacts' },
    ],
    filterRequests: 0,
    viewIdsRequested: [],
    epochOf: (id) => {
      const record = source.records.find((item) => item.id === id);
      return record === undefined ? Number.NaN : Date.parse(record.created_at);
    },
    handle: async ({ path, query }) => {
      if (path === '/api/contacts/filters') {
        source.filterRequests++;
        return { filters: source.filters };
      }
      const match = /^\/api\/contacts\/view\/(\d+)$/.exec(path);
      if (!match) {
        throw new Error(`Unexpected path ${path}`);
      }
      source.viewIdsRequested.push(match[1]);
      if (!source.filters.some((filter) => String(filter.id) === match[1])) {
        throw new FreshsalesApiError({ status: 404, message: 'not found' });
      }
      const page = Number(query['page']);
      const perPage = Number(query['per_page']);
      const sorted = [...source.records].sort(
        (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || b.id - a.id
      );
      return {
        contacts: sorted.slice((page - 1) * perPage, page * perPage),
        meta: { total_pages: Math.ceil(sorted.length / perPage), total: sorted.length },
      };
    },
  };
  return source;
}

type FakeRecord = { id: number; created_at: string };

type FakeSource = {
  records: FakeRecord[];
  filters: { id: number; name: string }[];
  filterRequests: number;
  viewIdsRequested: string[];
  epochOf: (id: number) => number;
  handle: (params: { path: string; query: Record<string, unknown> }) => Promise<unknown>;
};
