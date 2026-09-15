/// <reference types="vitest/globals" />

const { sendRequest } = vi.hoisted(() => ({ sendRequest: vi.fn() }));

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<
    typeof import('@activepieces/pieces-common')
  >();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

import { newIssue } from '../src/lib/triggers/new-issue';
import { newRock } from '../src/lib/triggers/new-rock';
import { newTodo } from '../src/lib/triggers/new-todo';

const auth = { secret_text: 'a-token' };

function fakeStore() {
  const data = new Map<string, unknown>();
  return {
    store: {
      get: async (key: string) => (data.has(key) ? data.get(key) : null),
      put: async (key: string, value: unknown) => {
        data.set(key, value);
        return value;
      },
      delete: async (key: string) => {
        data.delete(key);
      },
    },
    data,
  };
}

function reply(body: unknown) {
  sendRequest.mockResolvedValueOnce({ body });
}

const lastBody = () => sendRequest.mock.calls.at(-1)?.[0]?.body;
const lastUrl = () => sendRequest.mock.calls.at(-1)?.[0]?.url;

const AN_HOUR_AGO = Date.parse('2026-09-04T09:00:00.000Z');
const OLDER = '2026-09-04T08:30:00.000Z';
const NEWER = '2026-09-04T09:30:00.000Z';
const NEWEST = '2026-09-04T09:45:00.000Z';

beforeEach(() => sendRequest.mockReset());

describe('enabling a trigger', () => {
  test('a checkpoint is written without spending an API call', async () => {
    const { store, data } = fakeStore();
    await newTodo.onEnable({ auth, propsValue: {}, store });
    expect(typeof data.get('lastPoll')).toBe('number');
    expect(sendRequest).not.toHaveBeenCalled();
  });

  test('republishing a running flow keeps the existing checkpoint', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    await newTodo.onEnable({
      auth,
      propsValue: {},
      store,
      isRepublish: true,
    });
    expect(data.get('lastPoll')).toBe(AN_HOUR_AGO);
  });

  test('republishing a flow that never polled still seeds a checkpoint', async () => {
    const { store, data } = fakeStore();
    await newTodo.onEnable({
      auth,
      propsValue: {},
      store,
      isRepublish: true,
    });
    expect(typeof data.get('lastPoll')).toBe('number');
  });
});

describe('what a poll emits', () => {
  test('only records created after the checkpoint fire', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([
      { _id: 'new', createdDate: NEWER },
      { _id: 'old', createdDate: OLDER },
    ]);

    const fired = await newTodo.run({ auth, propsValue: {}, store });

    expect(fired).toEqual([{ _id: 'new', createdDate: NEWER }]);
  });

  test('the checkpoint advances to the newest record seen', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([
      { _id: 'newest', createdDate: NEWEST },
      { _id: 'newer', createdDate: NEWER },
    ]);

    await newTodo.run({ auth, propsValue: {}, store });

    expect(data.get('lastPoll')).toBe(Date.parse(NEWEST));
  });

  test('a second poll over the same records fires nothing', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    const page = [{ _id: 'new', createdDate: NEWER }];

    reply(page);
    const first = await newTodo.run({ auth, propsValue: {}, store });
    reply(page);
    const second = await newTodo.run({ auth, propsValue: {}, store });

    expect(first).toHaveLength(1);
    expect(second).toEqual([]);
  });

  test('an empty page fires nothing and leaves the checkpoint alone', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([]);

    const fired = await newTodo.run({ auth, propsValue: {}, store });

    expect(fired).toEqual([]);
    expect(data.get('lastPoll')).toBe(AN_HOUR_AGO);
  });

  test('a record with no created date is skipped rather than fired or crashed on', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([{ _id: 'undated' }, { _id: 'new', createdDate: NEWER }]);

    const fired = await newTodo.run({ auth, propsValue: {}, store });

    expect(fired).toEqual([{ _id: 'new', createdDate: NEWER }]);
  });

  test('an unparseable created date is skipped rather than treated as the epoch', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([{ _id: 'bad', createdDate: 'not a date' }]);

    const fired = await newTodo.run({ auth, propsValue: {}, store });

    expect(fired).toEqual([]);
    expect(data.get('lastPoll')).toBe(AN_HOUR_AGO);
  });
});

describe('rocks, which carry _id instead of id', () => {
  test('a new rock fires exactly once even though it has no id field', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    const page = [{ _id: 'r1', title: 'A rock', createdDate: NEWER }];

    reply(page);
    const first = await newRock.run({ auth, propsValue: {}, store });
    reply(page);
    const second = await newRock.run({ auth, propsValue: {}, store });

    expect(first).toHaveLength(1);
    expect(second).toEqual([]);
  });

  test('rocks are read newest-due first, because Ninety cannot sort them by creation', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply({ items: [], totalCount: 0 });

    await newRock.run({ auth, propsValue: {}, store });

    expect(lastUrl()).toBe('https://api.public.ninety.io/v1/rocks/query/paged');
    expect(lastBody().sortField).toBe('dueDate');
    expect(lastBody().archived).toBe(false);
    expect(lastBody().pageSize).toBe(200);
  });
});

describe('how each trigger asks for its newest page', () => {
  test('to-dos are never asked to sort, because Ninety rejects every creation-date sort with a 400', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([]);

    await newTodo.run({ auth, propsValue: {}, store });

    expect(lastBody().sort).toBeUndefined();
    expect(lastBody().order).toBeUndefined();
    expect(lastBody().page).toBe(1);
    expect(lastBody().archived).toBe(false);
  });

  test('issues use the uppercase direction and the zero-based page index', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply({ items: [], totalCount: 0 });

    await newIssue.run({ auth, propsValue: {}, store });

    expect(lastBody().sortField).toBe('createdDate');
    expect(lastBody().sortDirection).toBe('DESC');
    expect(lastBody().pageIndex).toBe(0);
  });

  test('a chosen team narrows the poll', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([]);

    await newTodo.run({ auth, propsValue: { teamId: 'team-1' }, store });

    expect(lastBody().teamId).toBe('team-1');
  });

  test('the personal scope is passed as isPersonal, since one call cannot cover both', async () => {
    const { store, data } = fakeStore();
    data.set('lastPoll', AN_HOUR_AGO);
    reply([]);

    await newTodo.run({ auth, propsValue: { scope: 'personal' }, store });

    expect(lastBody().isPersonal).toBe(true);
  });
});

describe('loading test data in the builder', () => {
  test('test data comes back without needing a checkpoint', async () => {
    const { store } = fakeStore();
    reply([{ _id: 't1', createdDate: OLDER }]);

    const items = await newTodo.test({ auth, propsValue: {}, store });

    expect(items).toEqual([{ _id: 't1', createdDate: OLDER }]);
  });

  test('test data is capped at five records', async () => {
    const { store } = fakeStore();
    reply(
      Array.from({ length: 9 }, (unused, index) => ({
        _id: `t${index}`,
        createdDate: OLDER,
      }))
    );

    const items = await newTodo.test({ auth, propsValue: {}, store });

    expect(items).toHaveLength(5);
  });

  test('every trigger ships sample data for the builder', () => {
    expect(newTodo.sampleData).toBeDefined();
    expect(newIssue.sampleData).toBeDefined();
    expect(newRock.sampleData).toBeDefined();
  });

  test('every trigger is tagged as a read for the agent surface', () => {
    expect(newTodo.classification).toBe('READ');
    expect(newIssue.classification).toBe('READ');
    expect(newRock.classification).toBe('READ');
  });
});
