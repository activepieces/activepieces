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
  it('asks Buffer for unpublished posts created since the last poll, newest first, and pages until done', async () => {
    const last = Date.parse('2026-11-10T10:00:00Z');
    sendRequest
      .mockResolvedValueOnce(page({ nodes: [{ id: 'p3', createdAt: '2026-11-10T11:00:00Z' }], endCursor: 'c1', hasNextPage: true }))
      .mockResolvedValueOnce(page({ nodes: [{ id: 'p2', createdAt: '2026-11-10T10:30:00Z' }], endCursor: 'c2', hasNextPage: false }));
    const store = memoryStore({ lastPoll: last });
    const items = await poll({ fn: newQueueItem.run, store });
    expect(variablesOf({ index: 0 })).toEqual({
      input: {
        organizationId: ORG,
        filter: { status: ['draft', 'needs_approval', 'scheduled', 'sending'], channelIds: ['c1'], createdAt: { start: '2026-11-10T10:00:00.000Z' } },
        sort: [{ field: 'createdAt', direction: 'desc' }],
      },
      first: 100,
    });
    expect(variablesOf({ index: 1 }).after).toBe('c1');
    expect(items).toEqual([{ id: 'p3', createdAt: '2026-11-10T11:00:00Z' }, { id: 'p2', createdAt: '2026-11-10T10:30:00Z' }]);
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
    expect(items).toHaveLength(1);
  });

  it('throws instead of silently stopping when more pages remain past the cap', async () => {
    sendRequest.mockImplementation(async () => page({ nodes: [{ id: 'p', createdAt: '2026-11-10T11:00:00Z' }], endCursor: `c${sendRequest.mock.calls.length}`, hasNextPage: true }));
    await expect(poll({ fn: newQueueItem.run, store: memoryStore({ lastPoll: 1 }) })).rejects.toThrow('more than one poll can read');
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
