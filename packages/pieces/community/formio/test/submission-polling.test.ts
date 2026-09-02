/// <reference types="vitest/globals" />

import { submissionPolling } from '../src/lib/triggers/submission-polling';

const findSubmissions = vi.fn();

vi.mock('../src/lib/common/client', () => ({
  formioCommon: {
    findSubmissions: (...args: unknown[]) => findSubmissions(...args),
  },
}));

const auth = { props: { projectUrl: 'https://forms.example.gov', apiKey: 'k' } };
const propsValue = { formPath: 'citizen-intake' };

function submission({
  id,
  created,
  modified,
}: {
  id: string;
  created: string;
  modified?: string;
}) {
  return {
    _id: id,
    form: 'f1',
    data: { fullName: id },
    created,
    modified: modified ?? created,
  };
}

function fakeStore(initial: Record<string, unknown> = {}) {
  const kept: Record<string, unknown> = { ...initial };
  return {
    kept,
    get: async (key: string) => kept[key],
    put: async (key: string, value: unknown) => {
      kept[key] = value;
      return value;
    },
    delete: async (key: string) => {
      delete kept[key];
    },
  };
}

async function poll({
  timestampField,
  lastFetchEpochMS,
  rows,
  store = fakeStore(),
}: {
  timestampField: 'created' | 'modified';
  lastFetchEpochMS: number;
  rows: ReturnType<typeof submission>[];
  store?: ReturnType<typeof fakeStore>;
}) {
  findSubmissions.mockResolvedValueOnce({ submissions: rows, total: rows.length });
  const polling = submissionPolling(timestampField);
  const items = await polling.items({
    auth,
    propsValue,
    lastFetchEpochMS,
    store,
  } as never);
  return { items, store, query: findSubmissions.mock.calls.at(-1)?.[0]?.queryParams };
}

describe('submission polling', () => {
  beforeEach(() => findSubmissions.mockReset());

  test('a cursored poll pages oldest-first, so a backlog drains instead of being skipped', async () => {
    const { query } = await poll({
      timestampField: 'created',
      lastFetchEpochMS: Date.parse('2026-09-02T08:00:00.000Z'),
      rows: [],
    });

    expect(query.sort).toBe('created');
    expect(query.sort.startsWith('-')).toBe(false);
  });

  test('an uncursored poll pages newest-first, so sample data is recent', async () => {
    const { query } = await poll({ timestampField: 'created', lastFetchEpochMS: 0, rows: [] });

    expect(query.sort).toBe('-created');
  });

  test('the cursor is sent to Form.io as an ISO timestamp filter', async () => {
    const cursor = Date.parse('2026-09-02T08:15:30.500Z');
    const { query } = await poll({ timestampField: 'created', lastFetchEpochMS: cursor, rows: [] });

    expect(query['created__gt']).toBe('2026-09-02T08:15:30.500Z');
  });

  test('the modified poll filters on modified rather than created', async () => {
    const cursor = Date.parse('2026-09-02T08:00:00.000Z');
    const { query } = await poll({ timestampField: 'modified', lastFetchEpochMS: cursor, rows: [] });

    expect(query['modified__gt']).toBe('2026-09-02T08:00:00.000Z');
    expect(query['created__gt']).toBeUndefined();
    expect(query.sort).toBe('modified');
  });

  test('no cursor means no timestamp filter at all', async () => {
    const { query } = await poll({ timestampField: 'created', lastFetchEpochMS: 0, rows: [] });

    expect(query['created__gt']).toBeUndefined();
  });

  test('a page size is always requested, so one poll cannot pull an unbounded list', async () => {
    const { query } = await poll({ timestampField: 'created', lastFetchEpochMS: 0, rows: [] });

    expect(Number(query.limit)).toBeGreaterThan(0);
  });

  test('the emitted timestamp comes from the field being polled', async () => {
    const { items } = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: 1,
      rows: [submission({ id: 's1', created: '2026-09-01T00:00:00.000Z', modified: '2026-09-02T10:00:00.000Z' })],
    });

    expect(items).toHaveLength(1);
    expect(items[0].epochMilliSeconds).toBe(Date.parse('2026-09-02T10:00:00.000Z'));
  });

  test('the updated poll ignores submissions that have never been edited', async () => {
    const { items } = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: 1,
      rows: [
        submission({ id: 'untouched', created: '2026-09-02T10:00:00.000Z' }),
        submission({ id: 'edited', created: '2026-09-01T09:00:00.000Z', modified: '2026-09-02T11:00:00.000Z' }),
      ],
    });

    expect(items.map((i) => (i.data as { _id: string })._id)).toEqual(['edited']);
  });

  test('the new-submission poll keeps every row, edited or not', async () => {
    const { items } = await poll({
      timestampField: 'created',
      lastFetchEpochMS: 1,
      rows: [
        submission({ id: 'a', created: '2026-09-02T10:00:00.000Z' }),
        submission({ id: 'b', created: '2026-09-02T10:00:01.000Z', modified: '2026-09-02T12:00:00.000Z' }),
      ],
    });

    expect(items).toHaveLength(2);
  });

  test('an unparseable timestamp becomes 0 rather than NaN, which would poison the cursor', async () => {
    const { items } = await poll({
      timestampField: 'created',
      lastFetchEpochMS: 1,
      rows: [{ _id: 'x', form: 'f1', data: {}, created: 'not a date' } as never],
    });

    expect(items[0].epochMilliSeconds).toBe(0);
    expect(Number.isNaN(items[0].epochMilliSeconds)).toBe(false);
  });

  test('the form path chosen in the step is the form queried', async () => {
    findSubmissions.mockResolvedValueOnce({ submissions: [], total: 0 });
    const polling = submissionPolling('created');
    await polling.items({
      auth,
      propsValue: { formPath: 'permit-renewal' },
      lastFetchEpochMS: 0,
      store: fakeStore(),
    } as never);

    expect(findSubmissions.mock.calls.at(-1)?.[0]?.formPath).toBe('permit-renewal');
  });
});

describe('cursor progress when a page is filtered away', () => {
  beforeEach(() => findSubmissions.mockReset());

  test('a page of never-edited rows still advances the cursor, so polling cannot stall', async () => {
    const cursor = Date.parse('2026-09-02T08:00:00.000Z');
    const untouched = Array.from({ length: 5 }, (_, i) =>
      submission({ id: `u${i}`, created: `2026-09-02T09:0${i}:00.000Z` })
    );

    const { items, store } = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: cursor,
      rows: untouched,
    });

    expect(items).toHaveLength(0);
    const marks = Object.values(store.kept);
    expect(marks).toHaveLength(1);
    expect(marks[0]).toBe(Date.parse('2026-09-02T09:04:00.000Z'));
    expect(Number(marks[0])).toBeGreaterThan(cursor);
  });

  test('the next poll asks past the discarded page rather than fetching it again', async () => {
    const cursor = Date.parse('2026-09-02T08:00:00.000Z');
    const untouched = Array.from({ length: 3 }, (_, i) =>
      submission({ id: `u${i}`, created: `2026-09-02T09:0${i}:00.000Z` })
    );

    const first = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: cursor,
      rows: untouched,
    });
    expect(first.query['modified__gt']).toBe('2026-09-02T08:00:00.000Z');

    const second = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: cursor,
      rows: [],
      store: first.store,
    });

    expect(second.query['modified__gt']).toBe('2026-09-02T09:02:00.000Z');
  });

  test('an edit sitting behind a page of untouched rows is eventually delivered', async () => {
    const cursor = Date.parse('2026-09-02T08:00:00.000Z');
    const untouched = Array.from({ length: 3 }, (_, i) =>
      submission({ id: `u${i}`, created: `2026-09-02T09:0${i}:00.000Z` })
    );
    const edited = submission({
      id: 'edited',
      created: '2026-09-01T07:00:00.000Z',
      modified: '2026-09-02T09:30:00.000Z',
    });

    const first = await poll({ timestampField: 'modified', lastFetchEpochMS: cursor, rows: untouched });
    expect(first.items).toHaveLength(0);

    const second = await poll({
      timestampField: 'modified',
      lastFetchEpochMS: cursor,
      rows: [edited],
      store: first.store,
    });

    expect(second.items.map((i) => (i.data as { _id: string })._id)).toEqual(['edited']);
  });

  test('the helper cursor wins when it is ahead, so re-enabling does not replay old rows', async () => {
    const store = fakeStore({
      'formio_high_water_mark_created_citizen-intake': Date.parse('2026-09-01T00:00:00.000Z'),
    });
    const reEnabledAt = Date.parse('2026-09-02T12:00:00.000Z');

    const { query } = await poll({
      timestampField: 'created',
      lastFetchEpochMS: reEnabledAt,
      rows: [],
      store,
    });

    expect(query['created__gt']).toBe('2026-09-02T12:00:00.000Z');
  });

  test('a sample run ignores the stored cursor and leaves it untouched', async () => {
    const store = fakeStore({
      'formio_high_water_mark_created_citizen-intake': Date.parse('2026-09-02T09:00:00.000Z'),
    });

    const { query, store: after } = await poll({
      timestampField: 'created',
      lastFetchEpochMS: 0,
      rows: [submission({ id: 'a', created: '2026-09-02T10:00:00.000Z' })],
      store,
    });

    expect(query['created__gt']).toBeUndefined();
    expect(query.sort).toBe('-created');
    expect(after.kept['formio_high_water_mark_created_citizen-intake']).toBe(
      Date.parse('2026-09-02T09:00:00.000Z')
    );
  });

  test('each form keeps its own high-water mark', async () => {
    const store = fakeStore();
    findSubmissions.mockResolvedValueOnce({
      submissions: [submission({ id: 'a', created: '2026-09-02T10:00:00.000Z' })],
      total: 1,
    });
    const polling = submissionPolling('created');
    await polling.items({
      auth,
      propsValue: { formPath: 'permit-renewal' },
      lastFetchEpochMS: 1,
      store,
    } as never);

    expect(Object.keys(store.kept)).toEqual([
      'formio_high_water_mark_created_permit-renewal',
    ]);
  });
});
