import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type VendorMessage = { id: string; threadId: string; internalDate: number };

const vendor = vi.hoisted(() => {
  const messages: VendorMessage[] = [];
  return { messages };
});

const raw = Buffer.from(
  [
    'From: a@example.com',
    'To: me@example.com',
    'Subject: Hi',
    '',
    'body',
    '',
  ].join('\r\n')
).toString('base64');

function envelope({ data }: { data: unknown }) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: { authorization: 'Bearer tok' },
    config: {
      agent: { proxy: 'http://user:secret@proxy:8080' },
      headers: { Authorization: 'Bearer tok' },
    },
  };
}

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      messages: {
        list: async ({ q }: { q: string }) => {
          const after = /after:(\d+)/.exec(q);
          const afterMs = after ? Number(after[1]) * 1000 : 0;
          const visible = vendor.messages
            .filter((message: VendorMessage) => message.internalDate > afterMs)
            .sort(
              (a: VendorMessage, b: VendorMessage) =>
                b.internalDate - a.internalDate
            );
          return envelope({
            data: {
              messages: visible.map(({ id, threadId }: VendorMessage) => ({
                id,
                threadId,
              })),
            },
          });
        },
        get: async ({ id }: { id: string }) => {
          const message = vendor.messages.find(
            (candidate: VendorMessage) => candidate.id === id
          );
          return envelope({
            data: {
              id,
              threadId: message?.threadId,
              internalDate: String(message?.internalDate),
              raw,
            },
          });
        },
      },
      threads: {
        get: async ({ id }: { id: string }) =>
          envelope({
            data: {
              id,
              messages: vendor.messages.filter(
                (message: VendorMessage) => message.threadId === id
              ),
            },
          }),
      },
    },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
}));

import { gmailNewEmailTrigger as trigger } from '../src/lib/triggers/new-email';

let clock = Date.parse('2026-11-01T10:00:00.000Z');
const tick = ({ seconds }: { seconds: number }) => {
  clock += seconds * 1000;
  return clock;
};

function addMessage({ id }: { id: string }) {
  vendor.messages.push({
    id,
    threadId: `t-${id}`,
    internalDate: tick({ seconds: 60 }),
  });
}

function memoryStore() {
  const data = new Map<string, string>();
  return {
    put: async (key: string, value: unknown) => {
      data.set(key, JSON.stringify(value));
      return value;
    },
    get: async (key: string): Promise<unknown> => {
      const value = data.get(key);
      return value === undefined ? null : JSON.parse(value);
    },
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function hookContext({
  store,
  isRepublish,
}: {
  store: ReturnType<typeof memoryStore>;
  isRepublish?: boolean;
}) {
  return {
    auth: {},
    propsValue: {},
    files: { write: async () => 'https://files.test/x' },
    store,
    isRepublish,
  };
}

function field({ from, key }: { from: unknown; key: string }): unknown {
  return typeof from === 'object' && from !== null
    ? Reflect.get(from, key)
    : undefined;
}

async function callHook({
  hook,
  context,
}: {
  hook: 'onEnable' | 'onDisable' | 'run';
  context: ReturnType<typeof hookContext>;
}): Promise<unknown> {
  const hookFn = trigger[hook];
  if (typeof hookFn !== 'function') {
    throw new Error(`trigger has no ${hook}`);
  }
  return Reflect.apply(hookFn, trigger, [context]);
}

async function poll({ store }: { store: ReturnType<typeof memoryStore> }) {
  const events = await callHook({
    hook: 'run',
    context: hookContext({ store }),
  });
  return Array.isArray(events) ? events : [];
}

const threadIds = (events: unknown[]) =>
  events.map((event) =>
    field({
      from: field({ from: field({ from: event, key: 'thread' }), key: 'data' }),
      key: 'id',
    })
  );

beforeEach(() => {
  vendor.messages = [];
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.spyOn(Date, 'now').mockImplementation(() => clock);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Email behaviour', () => {
  it('fires once per new email across polls and republish, with thread holding only data', async () => {
    addMessage({ id: 'old' });
    tick({ seconds: 60 });
    const store = memoryStore();
    await callHook({ hook: 'onEnable', context: hookContext({ store }) });
    expect(await poll({ store })).toEqual([]);
    addMessage({ id: 'new-1' });
    const fired = await poll({ store });
    expect(threadIds(fired)).toEqual(['t-new-1']);
    const thread = field({ from: fired[0], key: 'thread' });
    expect(Object.keys(Object(thread))).toEqual(['data']);
    const serialized = JSON.stringify(fired);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('Bearer');
    expect(await poll({ store })).toEqual([]);
    await callHook({
      hook: 'onDisable',
      context: hookContext({ store, isRepublish: true }),
    });
    await callHook({
      hook: 'onEnable',
      context: hookContext({ store, isRepublish: true }),
    });
    expect(await poll({ store })).toEqual([]);
    addMessage({ id: 'new-2' });
    expect(threadIds(await poll({ store }))).toEqual(['t-new-2']);
  });
});
