import { createHash } from 'node:crypto';

import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  watch: vi.fn<(params: { auth: unknown; query: unknown; channel: { id: string; token: string } }) => Promise<unknown>>(),
  stop: vi.fn<() => Promise<void>>(),
  listActivities: vi.fn<() => Promise<unknown>>(),
}));
const resolveAuth = vi.hoisted(() => vi.fn<() => Promise<{ access_token: string }>>());

vi.mock('../../../src/lib/common/activities', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../src/lib/common/activities')>();
  return { ...actual, ReportsApi: api };
});
vi.mock('../../../src/lib/common/token', () => ({ resolveAuth }));

const { createActivityTrigger } = await import('../../../src/lib/common/activity-trigger');
const { SAMPLE_EVENT } = await import('../../../src/lib/common/activities');

const AUTH = { type: 'OAUTH2', access_token: 'tok' };
const RESOLVED = { access_token: 'resolved' };
const WEBHOOK_URL = 'https://ipaas.example/api/v1/webhooks/flow-1';
const STORE_KEY = 'google-workspace:channel';
const PENDING_KEY = 'google-workspace:pending-token';
const LEGACY_SEEN_KEY = 'google-workspace:seen-events';
const SEEN_INDEX_KEY = 'google-workspace:seen-index';
const TIME = SAMPLE_EVENT.activity.id.time;

function activity(uniqueQualifier: string) {
  return { ...SAMPLE_EVENT.activity, id: { ...SAMPLE_EVENT.activity.id, uniqueQualifier } };
}

function digest(eventId: string) {
  return createHash('sha256').update(eventId).digest('hex');
}

function seenKey(eventId: string) {
  return `google-workspace:seen:${digest(eventId)}`;
}

type Gate = { before?: (params: { op: 'get' | 'put' | 'delete'; key: string; value?: unknown }) => Promise<void> };

function memoryStore(gate: Gate = {}) {
  const data = new Map<string, unknown>();
  const pass = async (params: { op: 'get' | 'put' | 'delete'; key: string; value?: unknown }) => {
    if (gate.before) await gate.before(params);
  };
  return {
    data,
    gate,
    put: vi.fn<(key: string, value: unknown) => Promise<unknown>>(async (key, value) => {
      await pass({ op: 'put', key, value });
      data.set(key, value);
      return value;
    }),
    get: vi.fn<(key: string) => Promise<unknown>>(async (key) => {
      await pass({ op: 'get', key });
      return data.get(key) ?? null;
    }),
    delete: vi.fn<(key: string) => Promise<void>>(async (key) => {
      await pass({ op: 'delete', key });
      data.delete(key);
    }),
  };
}

function deferred() {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

function barrier(parties: number) {
  let arrived = 0;
  const open = deferred();
  return async () => {
    arrived += 1;
    if (arrived >= parties) open.resolve();
    await open.promise;
  };
}

const trigger = createActivityTrigger({
  name: 'testTrigger',
  displayName: 'Test',
  description: 'Test',
  props: {},
  query: () => ({ application: 'admin', eventName: 'CREATE_USER' }),
  accept: ({ event }) => event.eventName !== 'IGNORED',
});

type Hook = (ctx: unknown) => Promise<unknown>;
const hooks = trigger as unknown as { onEnable: Hook; onRenew: Hook; onDisable: Hook; run: Hook; test: Hook };

function ctx(store: ReturnType<typeof memoryStore>, payload?: { headers?: Record<string, string>; body?: unknown }) {
  return { auth: AUTH, propsValue: {}, store, webhookUrl: WEBHOOK_URL, payload: { headers: {}, body: undefined, queryParams: {}, ...payload } };
}

beforeEach(() => {
  api.watch.mockReset().mockImplementation(async ({ channel }) => ({ id: channel.id, resourceId: 'res-1', expiration: '1' }));
  api.stop.mockReset().mockResolvedValue(undefined);
  api.listActivities.mockReset();
  resolveAuth.mockReset().mockResolvedValue(RESOLVED);
});

describe('createActivityTrigger()', () => {
  it('should be a webhook trigger renewed by cron with sample data', () => {
    expect(trigger.type).toBe('WEBHOOK');
    expect(trigger.renewConfiguration).toEqual({ strategy: 'CRON', cronExpression: '0 */4 * * *' });
    expect(trigger.sampleData).toBe(SAMPLE_EVENT);
  });

  it('should open a channel to the webhook url on enable and remember it with its token', async () => {
    const store = memoryStore();

    await hooks.onEnable(ctx(store));

    expect(api.watch).toHaveBeenCalledWith({
      auth: RESOLVED,
      query: { application: 'admin', eventName: 'CREATE_USER' },
      channel: expect.objectContaining({ address: WEBHOOK_URL, id: expect.any(String), token: expect.any(String), expiration: expect.any(Number) }),
    });
    const stored = store.data.get(STORE_KEY) as { id: string; resourceId: string; token: string; query: unknown };
    expect(stored.resourceId).toBe('res-1');
    expect(stored.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(stored.query).toEqual({ application: 'admin', eventName: 'CREATE_USER' });
    expect(api.stop).not.toHaveBeenCalled();
  });

  it('should open the new channel before stopping the old one on renew', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const first = store.data.get(STORE_KEY) as { id: string; token: string };

    await hooks.onRenew(ctx(store));

    const second = store.data.get(STORE_KEY) as { id: string; token: string };
    expect(second.id).not.toBe(first.id);
    expect(second.token).not.toBe(first.token);
    expect(api.watch).toHaveBeenCalledTimes(2);
    expect(api.stop).toHaveBeenCalledWith({ auth: RESOLVED, channel: expect.objectContaining({ id: first.id, resourceId: 'res-1' }) });
    expect(api.watch.mock.invocationCallOrder[1]).toBeLessThan(api.stop.mock.invocationCallOrder[0] as number);
  });

  it('should keep accepting the old channel token for a short grace period after renew, without duplicate events', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token: oldToken } = store.data.get(STORE_KEY) as { token: string };
    await hooks.onRenew(ctx(store));
    const { token: newToken } = store.data.get(STORE_KEY) as { token: string };

    const fromOld = (await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': oldToken }, body: SAMPLE_EVENT.activity }))) as unknown[];
    const fromNew = (await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': newToken }, body: SAMPLE_EVENT.activity }))) as unknown[];

    expect(fromOld).toHaveLength(1);
    expect(fromNew).toEqual([]);
  });

  it('should drop an event delivered before renewal and again after it', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token: oldToken } = store.data.get(STORE_KEY) as { token: string };

    const before = (await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': oldToken }, body: SAMPLE_EVENT.activity }))) as unknown[];
    await hooks.onRenew(ctx(store));
    const { token: newToken } = store.data.get(STORE_KEY) as { token: string };
    const after = (await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': newToken }, body: SAMPLE_EVENT.activity }))) as unknown[];

    expect(before).toHaveLength(1);
    expect(after).toEqual([]);
  });

  it('should drop a repeated event outside any renewal, keyed by one store entry per event', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;

    await expect(deliver(SAMPLE_EVENT.activity)).resolves.toHaveLength(1);
    await expect(deliver(SAMPLE_EVENT.activity)).resolves.toEqual([]);

    expect(store.data.get(seenKey(SAMPLE_EVENT.id))).toEqual(expect.any(Number));
    expect(store.data.get(SEEN_INDEX_KEY)).toEqual([digest(SAMPLE_EVENT.id)]);
    expect(store.put).not.toHaveBeenCalledWith(LEGACY_SEEN_KEY, expect.anything());
  });

  it('should cap the eviction index at 500 ids and delete the store entry of the evicted event', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;
    const oldIds = Array.from({ length: 500 }, (_, index) => `${TIME}:old-${index}`);
    store.data.set(SEEN_INDEX_KEY, oldIds.map(digest));
    oldIds.forEach((id) => store.data.set(seenKey(id), 1));

    await expect(deliver(activity('fresh'))).resolves.toHaveLength(1);

    const index = store.data.get(SEEN_INDEX_KEY) as string[];
    expect(index).toHaveLength(500);
    expect(index[0]).toBe(digest(`${TIME}:old-1`));
    expect(index[499]).toBe(digest(`${TIME}:fresh`));
    expect(store.data.has(seenKey(`${TIME}:old-0`))).toBe(false);
    expect(store.data.has(seenKey(`${TIME}:old-1`))).toBe(true);
    expect(store.data.has(seenKey(`${TIME}:fresh`))).toBe(true);
    expect([...store.data.keys()].filter((key) => key.startsWith('google-workspace:seen:'))).toHaveLength(500);
    await expect(deliver(activity('old-2'))).resolves.toEqual([]);
    await expect(deliver(activity('fresh'))).resolves.toEqual([]);
  });

  it('should still treat both events as seen when concurrent deliveries interleave read, read, write, write', async () => {
    const seenReads = barrier(2);
    const indexReads = barrier(2);
    const firstIndexWrite = deferred();
    let indexWrites = 0;
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    store.gate.before = async ({ op, key }) => {
      if (op === 'get' && key.startsWith('google-workspace:seen:')) await seenReads();
      if (op === 'get' && key === SEEN_INDEX_KEY) await indexReads();
      if (op === 'put' && key === SEEN_INDEX_KEY) {
        indexWrites += 1;
        if (indexWrites === 1) {
          firstIndexWrite.resolve();
          return;
        }
        await firstIndexWrite.promise;
        await new Promise((resolve) => setTimeout(resolve, 5));
      }
    };
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;

    const [first, second] = await Promise.all([deliver(activity('a')), deliver(activity('b'))]);
    store.gate.before = undefined;

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(store.data.get(SEEN_INDEX_KEY)).toHaveLength(1);
    expect(store.data.has(seenKey(`${TIME}:a`))).toBe(true);
    expect(store.data.has(seenKey(`${TIME}:b`))).toBe(true);
    await expect(deliver(activity('a'))).resolves.toEqual([]);
    await expect(deliver(activity('b'))).resolves.toEqual([]);
  });

  it('should treat ids from the legacy seen list as seen without writing it, and drop it on enable', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    store.data.set(LEGACY_SEEN_KEY, [`${TIME}:legacy`]);
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;

    await expect(deliver(activity('legacy'))).resolves.toEqual([]);
    await expect(deliver(activity('new'))).resolves.toHaveLength(1);
    expect(store.data.get(LEGACY_SEEN_KEY)).toEqual([`${TIME}:legacy`]);
    expect(store.put).not.toHaveBeenCalledWith(LEGACY_SEEN_KEY, expect.anything());

    await hooks.onEnable(ctx(store));
    expect(store.data.has(LEGACY_SEEN_KEY)).toBe(false);
  });

  it('should save the new channel token as pending before watch so deliveries during renew are accepted', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const delivered: unknown[][] = [];
    api.watch.mockImplementationOnce(async ({ channel }) => {
      expect(store.data.get(PENDING_KEY)).toBe(channel.token);
      delivered.push((await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': channel.token }, body: SAMPLE_EVENT.activity }))) as unknown[]);
      return { id: channel.id, resourceId: 'res-2', expiration: '1' };
    });

    await hooks.onRenew(ctx(store));

    expect(delivered).toEqual([[expect.objectContaining({ id: SAMPLE_EVENT.id })]]);
    expect(store.data.has(PENDING_KEY)).toBe(false);
    expect(store.data.get(STORE_KEY)).toEqual(expect.objectContaining({ resourceId: 'res-2', previousToken: expect.any(String) }));
  });

  it('should accept deliveries with the pending token while the first channel is being opened on enable', async () => {
    const store = memoryStore();
    const delivered: unknown[][] = [];
    api.watch.mockImplementationOnce(async ({ channel }) => {
      delivered.push((await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': channel.token }, body: SAMPLE_EVENT.activity }))) as unknown[]);
      return { id: channel.id, resourceId: 'res-1', expiration: '1' };
    });

    await hooks.onEnable(ctx(store));

    expect(delivered).toEqual([[expect.objectContaining({ id: SAMPLE_EVENT.id })]]);
    expect(store.data.has(PENDING_KEY)).toBe(false);
  });

  it('should roll back the pending token and keep the old channel when watch fails on renew', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const before = structuredClone(store.data.get(STORE_KEY)) as { token: string };
    let pendingToken = '';
    api.watch.mockImplementationOnce(async ({ channel }) => {
      pendingToken = channel.token;
      throw new Error('403 forbidden');
    });

    await expect(hooks.onRenew(ctx(store))).rejects.toThrow('403 forbidden');

    expect(store.data.has(PENDING_KEY)).toBe(false);
    expect(store.data.get(STORE_KEY)).toEqual(before);
    expect(api.stop).not.toHaveBeenCalled();
    await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': pendingToken }, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
    await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': before.token }, body: SAMPLE_EVENT.activity }))).resolves.toHaveLength(1);
  });

  it('should reject the old channel token once the grace period is over', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token: oldToken } = store.data.get(STORE_KEY) as { token: string };
    await hooks.onRenew(ctx(store));
    const now = Date.now();
    const clock = vi.spyOn(Date, 'now').mockReturnValue(now + 16 * 60 * 1000);

    await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': oldToken }, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
    clock.mockRestore();
  });

  it('should stop the channel on disable, tolerate an expired one, and forget it with every seen event', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body: activity('a') }));
    await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body: activity('b') }));
    store.data.set(LEGACY_SEEN_KEY, ['legacy']);
    store.data.set(PENDING_KEY, 'stale');
    api.stop.mockRejectedValueOnce(new Error('404 notFound'));

    await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

    expect(api.stop).toHaveBeenCalledTimes(1);
    expect([...store.data.keys()]).toEqual([]);
  });
  it('should turn a notification with the right token into events, applying the accept filter', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const body = {
      ...SAMPLE_EVENT.activity,
      events: [
        { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [{ name: 'USER_EMAIL', value: 'jane@example.com' }] },
        { type: 'USER_SETTINGS', name: 'IGNORED', parameters: [] },
      ],
    };

    const items = (await hooks.run(ctx(store, { headers: { 'X-Goog-Channel-Token': token, 'x-goog-resource-state': 'exists' }, body }))) as {
      eventName: string;
    }[];

    expect(items.map((i) => i.eventName)).toEqual(['CREATE_USER']);
  });

  it('should key every emitted event by its id for the platform dedupe', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const body = {
      ...SAMPLE_EVENT.activity,
      events: [
        { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [] },
        { type: 'USER_SETTINGS', name: 'DELETE_USER', parameters: [] },
      ],
    };

    const items = (await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body }))) as Record<string, unknown>[];

    expect(items).toHaveLength(2);
    expect(items.map((i) => i[DEDUPE_KEY_PROPERTY])).toEqual(items.map((i) => i['id']));
    expect(items.map((i) => i[DEDUPE_KEY_PROPERTY])).toEqual([`${SAMPLE_EVENT.id}:0`, `${SAMPLE_EVENT.id}:1`]);
    expect(store.data.get(SEEN_INDEX_KEY)).toEqual([digest(`${SAMPLE_EVENT.id}:0`), digest(`${SAMPLE_EVENT.id}:1`)]);
  });

  it('should ignore the sync message and anything without the channel token', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };

    await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token, 'x-goog-resource-state': 'sync' } }))).resolves.toEqual([]);
    await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': 'forged' }, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
    await expect(hooks.run(ctx(store, { headers: {}, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
    await expect(hooks.run(ctx(memoryStore(), { headers: { 'x-goog-channel-token': token }, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
  });

  it('should read the latest activities through the list endpoint on test, flattened and filtered', async () => {
    api.listActivities.mockResolvedValue([
      { id: { time: 't1', uniqueQualifier: '1' }, events: [{ type: 'USER_SETTINGS', name: 'CREATE_USER' }, { name: 'IGNORED' }] },
      { id: { time: 't2', uniqueQualifier: '2' }, events: [{ type: 'USER_SETTINGS', name: 'CREATE_USER' }] },
    ]);

    const items = (await hooks.test(ctx(memoryStore()))) as { id: string }[];

    expect(api.listActivities).toHaveBeenCalledWith({ auth: RESOLVED, query: { application: 'admin', eventName: 'CREATE_USER', maxResults: 50 } });
    expect(items.map((i) => i.id)).toEqual(['t1:1:0', 't2:2']);
    expect(items.every((i) => !Object.prototype.hasOwnProperty.call(i, DEDUPE_KEY_PROPERTY))).toBe(true);
    expect(api.watch).not.toHaveBeenCalled();
  });
});
