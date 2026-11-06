import { httpClient } from '@activepieces/pieces-common';
import { createMockPollingTriggerContext, InputPropertyMap, Store } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { newEmailReceivedTrigger } from '../src/lib/triggers/new-email-received-trigger';

const AUTH = { access_token: 'tok', props: { location: 'zoho.com' } };
const CHECKPOINT = 1_700_000_000_000;

type Message = { messageId: string; receivedTime: string };

function makeMessages({ newer, older }: { newer: number; older: number }): Message[] {
  const total = newer + older;
  return Array.from({ length: total }, (_, index) => ({
    messageId: `m${index}`,
    receivedTime: String(CHECKPOINT + (newer - index) * 1000),
  }));
}

function mockMailbox({ messages }: { messages: Message[] }) {
  return vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request) => {
    const start = Number(request.queryParams?.['start'] ?? '1');
    const limit = Number(request.queryParams?.['limit'] ?? '10');
    return { status: 200, headers: {}, body: { data: messages.slice(start - 1, start - 1 + limit) } };
  });
}

function createStore(): Store {
  const values = new Map<string, string>();
  return {
    put: async <T>(key: string, value: T) => {
      values.set(key, JSON.stringify(value));
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => {
      const raw = values.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    delete: async (key: string) => {
      values.delete(key);
    },
  };
}

function callTrigger({
  method,
  propsValue,
  store,
}: {
  method: 'run' | 'test';
  propsValue: { accountId: string; folderId?: string };
  store: Store;
}): Promise<unknown[]> {
  const base = createMockPollingTriggerContext<InputPropertyMap>({ propsValue: {} });
  const fn = newEmailReceivedTrigger[method];
  if (typeof fn !== 'function') {
    throw new Error('trigger has no ' + method);
  }
  return Promise.resolve(Reflect.apply(fn, newEmailReceivedTrigger, [{ ...base, auth: AUTH, propsValue, store }]));
}

function requestedPages({ spy }: { spy: ReturnType<typeof mockMailbox> }) {
  return spy.mock.calls.map(([request]) => ({
    start: request.queryParams?.['start'],
    limit: request.queryParams?.['limit'],
  }));
}

function idsOf({ items }: { items: unknown[] }): string[] {
  return items.map((item) => {
    if (typeof item === 'object' && item !== null && 'messageId' in item && typeof item.messageId === 'string') {
      return item.messageId;
    }
    throw new Error('item has no messageId');
  });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('new email received trigger pagination', () => {
  it('pages through 450 new messages at starts 1, 201, 401 and stops on the short page', async () => {
    const spy = mockMailbox({ messages: makeMessages({ newer: 450, older: 0 }) });
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const items = await callTrigger({ method: 'run', propsValue: { accountId: 'acc1' }, store });

    expect(requestedPages({ spy })).toEqual([
      { start: '1', limit: '200' },
      { start: '201', limit: '200' },
      { start: '401', limit: '200' },
    ]);
    const ids = idsOf({ items });
    expect(ids).toHaveLength(450);
    expect(new Set(ids).size).toBe(450);
  });

  it('stops paging at the saved timestamp without requesting a further page', async () => {
    const spy = mockMailbox({ messages: makeMessages({ newer: 250, older: 300 }) });
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const items = await callTrigger({ method: 'run', propsValue: { accountId: 'acc1' }, store });

    expect(requestedPages({ spy })).toEqual([
      { start: '1', limit: '200' },
      { start: '201', limit: '200' },
    ]);
    const ids = idsOf({ items });
    expect(ids).toHaveLength(250);
    expect(new Set(ids).size).toBe(250);
  });

  it('stops at the saved timestamp even when a full page is exactly consumed', async () => {
    const spy = mockMailbox({ messages: makeMessages({ newer: 200, older: 300 }) });
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    const items = await callTrigger({ method: 'run', propsValue: { accountId: 'acc1' }, store });

    expect(requestedPages({ spy })).toEqual([
      { start: '1', limit: '200' },
      { start: '201', limit: '200' },
    ]);
    expect(idsOf({ items })).toHaveLength(200);
  });

  it('requests only 10 messages in test mode', async () => {
    const spy = mockMailbox({ messages: makeMessages({ newer: 450, older: 0 }) });

    const items = await callTrigger({ method: 'test', propsValue: { accountId: 'acc1' }, store: createStore() });

    expect(requestedPages({ spy })).toEqual([{ start: '1', limit: '10' }]);
    expect(items.length).toBeGreaterThan(0);
    expect(items.length).toBeLessThanOrEqual(5);
  });

  it('passes folderId as a query param only when it is set', async () => {
    const spy = mockMailbox({ messages: makeMessages({ newer: 3, older: 0 }) });
    const store = createStore();
    await store.put('lastPoll', CHECKPOINT);

    await callTrigger({ method: 'run', propsValue: { accountId: 'acc1', folderId: 'f42' }, store });
    await callTrigger({ method: 'run', propsValue: { accountId: 'acc1', folderId: '' }, store });
    await callTrigger({ method: 'run', propsValue: { accountId: 'acc1' }, store });

    const queries = spy.mock.calls.map(([request]) => request.queryParams);
    expect(queries[0]?.['folderId']).toBe('f42');
    expect(queries[1] && 'folderId' in queries[1]).toBe(false);
    expect(queries[2] && 'folderId' in queries[2]).toBe(false);
  });
});
