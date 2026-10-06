import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  watch: vi.fn<(params: { auth: unknown; query: unknown; channel: { id: string } }) => Promise<unknown>>(),
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
const SEEN_KEY = 'google-workspace:seen-events';

function activity(uniqueQualifier: string) {
  return { ...SAMPLE_EVENT.activity, id: { ...SAMPLE_EVENT.activity.id, uniqueQualifier } };
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    data,
    put: vi.fn<(key: string, value: unknown) => Promise<unknown>>(async (key, value) => {
      data.set(key, value);
      return value;
    }),
    get: vi.fn<(key: string) => Promise<unknown>>(async (key) => data.get(key) ?? null),
    delete: vi.fn<(key: string) => Promise<void>>(async (key) => {
      data.delete(key);
    }),
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

  it('should drop a repeated event outside any renewal and remember at most 500 ids', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;

    await expect(deliver(SAMPLE_EVENT.activity)).resolves.toHaveLength(1);
    await expect(deliver(SAMPLE_EVENT.activity)).resolves.toEqual([]);

    store.data.set(SEEN_KEY, Array.from({ length: 500 }, (_, index) => `old-${index}`));
    await expect(deliver(activity('fresh'))).resolves.toHaveLength(1);
    const seen = store.data.get(SEEN_KEY) as string[];
    expect(seen).toHaveLength(500);
    expect(seen[0]).toBe('old-1');
    expect(seen[499]).toBe(`${SAMPLE_EVENT.activity.id.time}:fresh`);
  });

  it('should keep the ids of concurrent deliveries of different events', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    const { token } = store.data.get(STORE_KEY) as { token: string };
    const deliver = (body: unknown) => hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<unknown[]>;

    const [first, second] = await Promise.all([deliver(activity('a')), deliver(activity('b'))]);

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(1);
    expect(store.data.get(SEEN_KEY)).toEqual(expect.arrayContaining([`${SAMPLE_EVENT.activity.id.time}:a`, `${SAMPLE_EVENT.activity.id.time}:b`]));
    await expect(deliver(activity('a'))).resolves.toEqual([]);
    await expect(deliver(activity('b'))).resolves.toEqual([]);
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

  it('should stop the channel on disable, tolerate an expired one, and forget it', async () => {
    const store = memoryStore();
    await hooks.onEnable(ctx(store));
    api.stop.mockRejectedValueOnce(new Error('404 notFound'));

    await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

    expect(api.stop).toHaveBeenCalledTimes(1);
    expect(store.data.has(STORE_KEY)).toBe(false);
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
    expect(api.watch).not.toHaveBeenCalled();
  });
});
