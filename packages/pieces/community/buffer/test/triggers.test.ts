import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { newQueueItem } from '../src/lib/triggers/new-queue-item';
import { newSentItem } from '../src/lib/triggers/new-sent-item';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return {
    ...actual,
    httpClient: {
      sendRequest: (...args: unknown[]) => sendRequest(...args),
    },
  };
});

const AUTH = { type: AppConnectionType.SECRET_TEXT, secret_text: 'key' };
const ORG = 'org1';

function memoryStore({ lastPoll }: { lastPoll?: number }) {
  const data = new Map<string, unknown>();
  if (lastPoll !== undefined) data.set('lastPoll', lastPoll);
  return {
    data,
    get: async (key: string): Promise<unknown> => data.get(key) ?? null,
    put: async (key: string, value: unknown): Promise<unknown> => {
      data.set(key, value);
      return value;
    },
    delete: async (key: string): Promise<void> => {
      data.delete(key);
    },
  };
}

function page({ nodes, endCursor, hasNextPage }: { nodes: unknown[]; endCursor: string | null; hasNextPage: boolean }) {
  return { status: 200, headers: {}, body: { data: { posts: { edges: nodes.map((node) => ({ node })), pageInfo: { endCursor, hasNextPage } } } } };
}

function poll({ fn, store }: { fn: (ctx: never) => Promise<unknown[]>; store: ReturnType<typeof memoryStore> }): Promise<unknown[]> {
  return Reflect.apply(fn, undefined, [{ auth: AUTH, propsValue: { organizationId: ORG, channelIds: ['c1'] }, store, files: {} }]);
}

function variablesOf({ index }: { index: number }) {
  return sendRequest.mock.calls[index][0].body.variables;
}

beforeEach(() => {
  sendRequest.mockReset();
});

describe('new_queue_item', () => {
  it('asks Buffer for unpublished posts created since the last poll, oldest first, and pages until done', async () => {
    const last = Date.parse('2026-11-10T10:00:00Z');
    sendRequest
      .mockResolvedValueOnce(page({ nodes: [{ id: 'p2', createdAt: '2026-11-10T10:30:00Z' }], endCursor: 'c1', hasNextPage: true }))
      .mockResolvedValueOnce(page({ nodes: [{ id: 'p3', createdAt: '2026-11-10T11:00:00Z' }], endCursor: 'c2', hasNextPage: false }));
    const store = memoryStore({ lastPoll: last });
    const items = await poll({ fn: newQueueItem.run, store });
    expect(variablesOf({ index: 0 })).toEqual({
      input: {
        organizationId: ORG,
        filter: { status: ['draft', 'needs_approval', 'scheduled', 'sending'], channelIds: ['c1'], createdAt: { start: '2026-11-10T09:59:59.999Z' } },
        sort: [{ field: 'createdAt', direction: 'asc' }],
      },
      first: 100,
    });
    expect(variablesOf({ index: 1 }).after).toBe('c1');
    expect(items).toEqual([{ id: 'p2', createdAt: '2026-11-10T10:30:00Z' }, { id: 'p3', createdAt: '2026-11-10T11:00:00Z' }]);
    expect(store.data.get('lastPoll')).toBe(Date.parse('2026-11-10T11:00:00Z'));
  });

  it('lets a poll error throw instead of returning nothing, and keeps the checkpoint', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { errors: [{ message: 'boom', extensions: { code: 'UNEXPECTED' } }], data: null } });
    const store = memoryStore({ lastPoll: 5 });
    await expect(poll({ fn: newQueueItem.run, store })).rejects.toThrow('UNEXPECTED');
    expect(store.data.get('lastPoll')).toBe(5);
  });

  it('uses a single small page with no time filter when testing', async () => {
    sendRequest.mockResolvedValueOnce(page({ nodes: [{ id: 'p1', createdAt: '2026-11-01T00:00:00Z' }], endCursor: 'x', hasNextPage: true }));
    const items = await poll({ fn: newQueueItem.test, store: memoryStore({}) });
    expect(sendRequest).toHaveBeenCalledTimes(1);
    expect(variablesOf({ index: 0 }).first).toBe(10);
    expect(variablesOf({ index: 0 }).input.filter.createdAt).toBeUndefined();
    expect(variablesOf({ index: 0 }).input.sort).toEqual([{ field: 'createdAt', direction: 'desc' }]);
    expect(items).toHaveLength(1);
  });

  it('emits what fits in ten pages instead of throwing, and the next poll resumes after the last emitted post with no gap or duplicate', async () => {
    const base = Date.parse('2026-11-10T10:00:00Z');
    const backlog = Array.from({ length: 1050 }, (_, index) => ({ id: `q${index}`, createdAt: new Date(base + 1000 + index * 1000).toISOString() }));
    const store = memoryStore({ lastPoll: base });
    sendRequest.mockImplementation(async () => {
      const call = sendRequest.mock.calls.length - 1;
      return page({ nodes: backlog.slice(call * 100, call * 100 + 100), endCursor: `c${call}`, hasNextPage: true });
    });
    const first = await poll({ fn: newQueueItem.run, store });
    expect(sendRequest).toHaveBeenCalledTimes(10);
    expect(first).toHaveLength(1000);
    expect(store.data.get('lastPoll')).toBe(Date.parse(backlog[999].createdAt));
    sendRequest.mockReset();
    sendRequest.mockResolvedValueOnce(page({ nodes: backlog.slice(999), endCursor: null, hasNextPage: false }));
    const second = await poll({ fn: newQueueItem.run, store });
    expect(variablesOf({ index: 0 }).input.filter.createdAt).toEqual({ start: new Date(Date.parse(backlog[999].createdAt) - 1).toISOString() });
    expect(second).toEqual(backlog.slice(1000));
    expect([...first, ...second]).toEqual(backlog);
  });

  it('delivers a post that shares the checkpoint millisecond on the next poll, once, when the cap split the group', async () => {
    const at = '2026-11-10T11:00:00.000Z';
    const store = memoryStore({ lastPoll: Date.parse('2026-11-10T10:00:00Z') });
    sendRequest.mockResolvedValueOnce(page({ nodes: [{ id: 'a', createdAt: at }], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newQueueItem.run, store })).resolves.toEqual([{ id: 'a', createdAt: at }]);
    expect(store.data.get('lastPollIds')).toEqual({ epoch: Date.parse(at), ids: ['a'] });
    sendRequest.mockResolvedValueOnce(page({ nodes: [{ id: 'a', createdAt: at }, { id: 'b', createdAt: at }], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newQueueItem.run, store })).resolves.toEqual([{ id: 'b', createdAt: at }]);
    expect(store.data.get('lastPollIds')).toEqual({ epoch: Date.parse(at), ids: ['a', 'b'] });
    sendRequest.mockResolvedValueOnce(page({ nodes: [{ id: 'a', createdAt: at }, { id: 'b', createdAt: at }], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newQueueItem.run, store })).resolves.toEqual([]);
    expect(store.data.get('lastPoll')).toBe(Date.parse(at));
  });

  it('ignores boundary IDs saved for a different checkpoint', async () => {
    const at = '2026-11-10T11:00:00.000Z';
    const store = memoryStore({ lastPoll: Date.parse(at) });
    store.data.set('lastPollIds', { epoch: Date.parse(at) - 5, ids: ['a'] });
    sendRequest.mockResolvedValueOnce(page({ nodes: [{ id: 'a', createdAt: at }], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newQueueItem.run, store })).resolves.toEqual([{ id: 'a', createdAt: at }]);
  });
});

describe('new_sent_item', () => {
  it('asks for sent posts by scheduled time with a one-day lookback and emits only those sent after the checkpoint', async () => {
    const last = Date.parse('2026-11-10T10:00:00Z');
    sendRequest.mockResolvedValueOnce(page({
      nodes: [
        { id: 'new', status: 'sent', dueAt: '2026-11-10T10:30:00Z', sentAt: '2026-11-10T10:30:05Z' },
        { id: 'old', status: 'sent', dueAt: '2026-11-10T09:00:00Z', sentAt: '2026-11-10T09:00:04Z' },
      ],
      endCursor: null,
      hasNextPage: false,
    }));
    const items = await poll({ fn: newSentItem.run, store: memoryStore({ lastPoll: last }) });
    expect(variablesOf({ index: 0 }).input).toEqual({
      organizationId: ORG,
      filter: { status: ['sent'], channelIds: ['c1'], dueAt: { start: '2026-11-09T10:00:00.000Z' } },
      sort: [{ field: 'dueAt', direction: 'desc' }],
    });
    expect(items).toEqual([{ id: 'new', status: 'sent', dueAt: '2026-11-10T10:30:00Z', sentAt: '2026-11-10T10:30:05Z' }]);
  });
});

describe('new_sent_item past the page cap', () => {
  const last = Date.parse('2026-11-10T10:00:00Z');
  const delivered = Array.from({ length: 1100 }, (_, index) => ({
    id: `old${index}`,
    status: 'sent',
    dueAt: new Date(last - 60_000 - index * 60_000).toISOString(),
    sentAt: new Date(last - 59_000 - index * 60_000).toISOString(),
  }));

  function serve({ fresh }: { fresh: unknown[] }) {
    const all = [...fresh, ...delivered];
    sendRequest.mockImplementation(async () => {
      const call = sendRequest.mock.calls.length - 1;
      const hasNextPage = (call + 1) * 100 < all.length;
      return page({ nodes: all.slice(call * 100, call * 100 + 100), endCursor: hasNextPage ? `c${call}` : null, hasNextPage });
    });
  }

  it('does not throw when more than 1,000 already-delivered posts sit in the lookback, and still delivers the new ones', async () => {
    const store = memoryStore({ lastPoll: last });
    const fresh = [
      { id: 'n2', status: 'sent', dueAt: '2026-11-10T10:20:00Z', sentAt: '2026-11-10T10:20:03Z' },
      { id: 'n1', status: 'sent', dueAt: '2026-11-10T10:10:00Z', sentAt: '2026-11-10T10:10:03Z' },
    ];
    serve({ fresh });
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual(fresh);
    expect(sendRequest).toHaveBeenCalledTimes(10);
    expect(store.data.get('lastPoll')).toBe(Date.parse('2026-11-10T10:20:03Z'));
  });

  it('keeps delivering on later polls, without re-emitting, while the lookback stays over the cap', async () => {
    const store = memoryStore({ lastPoll: last });
    const first = { id: 'n1', status: 'sent', dueAt: '2026-11-10T10:10:00Z', sentAt: '2026-11-10T10:10:03Z' };
    serve({ fresh: [first] });
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([first]);
    sendRequest.mockReset();
    const second = { id: 'n2', status: 'sent', dueAt: '2026-11-10T10:20:00Z', sentAt: '2026-11-10T10:20:03Z' };
    serve({ fresh: [second, first] });
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([second]);
    sendRequest.mockReset();
    serve({ fresh: [second, first] });
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([]);
    expect(store.data.get('lastPoll')).toBe(Date.parse('2026-11-10T10:20:03Z'));
  });

  it('delivers a post sent in the same millisecond as the checkpoint exactly once', async () => {
    const store = memoryStore({ lastPoll: last });
    const a = { id: 'a', status: 'sent', dueAt: '2026-11-10T10:10:00Z', sentAt: '2026-11-10T10:10:03Z' };
    const b = { id: 'b', status: 'sent', dueAt: '2026-11-10T10:09:00Z', sentAt: '2026-11-10T10:10:03Z' };
    sendRequest.mockResolvedValueOnce(page({ nodes: [a], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([a]);
    sendRequest.mockResolvedValueOnce(page({ nodes: [a, b], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([b]);
    sendRequest.mockResolvedValueOnce(page({ nodes: [a, b], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([]);
  });

  it('throws on a missing checkpoint instead of emitting history', async () => {
    await expect(poll({ fn: newSentItem.run, store: memoryStore({}) })).rejects.toThrow("lastPoll doesn't exist");
    expect(sendRequest).not.toHaveBeenCalled();
  });
});

describe('trigger edge cases (QA)', () => {
  it('throws when Buffer repeats a cursor instead of looping forever', async () => {
    sendRequest.mockResolvedValue(page({ nodes: [{ id: 'p', createdAt: '2026-11-10T11:00:00Z' }], endCursor: 'same', hasNextPage: true }));
    await expect(poll({ fn: newQueueItem.run, store: memoryStore({ lastPoll: 1 }) })).rejects.toThrow('same page cursor twice');
    expect(sendRequest).toHaveBeenCalledTimes(2);
  });

  it('returns nothing and keeps the checkpoint when edges is null', async () => {
    sendRequest.mockResolvedValueOnce({ status: 200, headers: {}, body: { data: { posts: { edges: null, pageInfo: { endCursor: null, hasNextPage: false } } } } });
    const store = memoryStore({ lastPoll: 42 });
    await expect(poll({ fn: newQueueItem.run, store })).resolves.toEqual([]);
    expect(store.data.get('lastPoll')).toBe(42);
  });

  it('omits the channel filter when no channels are chosen', async () => {
    sendRequest.mockResolvedValueOnce(page({ nodes: [], endCursor: null, hasNextPage: false }));
    await Reflect.apply(newSentItem.run, undefined, [{ auth: AUTH, propsValue: { organizationId: ORG, channelIds: [] }, store: memoryStore({ lastPoll: Date.parse('2026-11-10T10:00:00Z') }), files: {} }]);
    expect(variablesOf({ index: 0 }).input.filter).toEqual({ status: ['sent'], dueAt: { start: '2026-11-09T10:00:00.000Z' } });
  });

  it('moves the sent checkpoint to the newest sentAt, so the next poll does not re-emit', async () => {
    const last = Date.parse('2026-11-10T10:00:00Z');
    const store = memoryStore({ lastPoll: last });
    const node = { id: 'a', status: 'sent', dueAt: '2026-11-10T10:30:00Z', sentAt: '2026-11-10T10:30:05Z' };
    sendRequest.mockResolvedValueOnce(page({ nodes: [node], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newSentItem.run, store })).resolves.toHaveLength(1);
    sendRequest.mockResolvedValueOnce(page({ nodes: [node], endCursor: null, hasNextPage: false }));
    await expect(poll({ fn: newSentItem.run, store })).resolves.toEqual([]);
    expect(store.data.get('lastPoll')).toBe(Date.parse('2026-11-10T10:30:05Z'));
  });

  it('sets lastPoll on enable without calling Buffer', async () => {
    const store = memoryStore({});
    await Reflect.apply(newQueueItem.onEnable, undefined, [{ auth: AUTH, propsValue: { organizationId: ORG }, store }]);
    expect(typeof store.data.get('lastPoll')).toBe('number');
    expect(sendRequest).not.toHaveBeenCalled();
  });
});
