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
const LEDGER_KEY = 'google-workspace:handled-events';
const GRACE_MS = 15 * 60 * 1000;
const LEDGER_WINDOW_MS = 24 * 60 * 60 * 1000;
const LEDGER_CAP = 2000;
const STORE_VALUE_LIMIT_BYTES = 512 * 1024;

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

function deliver({ store, token, body = SAMPLE_EVENT.activity }: { store: ReturnType<typeof memoryStore>; token: string; body?: unknown }) {
  return hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<Record<string, unknown>[]>;
}

async function enabled() {
  const store = memoryStore();
  await hooks.onEnable(ctx(store));
  const { token } = store.data.get(STORE_KEY) as { token: string };
  return { store, token };
}

beforeEach(() => {
  vi.restoreAllMocks();
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
    const { store } = await enabled();

    expect(api.watch).toHaveBeenCalledWith({
      auth: RESOLVED,
      query: { application: 'admin', eventName: 'CREATE_USER' },
      channel: expect.objectContaining({ address: WEBHOOK_URL, id: expect.any(String), token: expect.any(String), expiration: expect.any(Number) }),
    });
    const stored = store.data.get(STORE_KEY) as { id: string; resourceId: string; token: string; query: unknown };
    expect(stored.resourceId).toBe('res-1');
    expect(stored.token).toMatch(/^[0-9a-f-]{36}$/);
    expect(stored.query).toEqual({ application: 'admin', eventName: 'CREATE_USER' });
    expect([...store.data.keys()]).toEqual([STORE_KEY]);
    expect(api.stop).not.toHaveBeenCalled();
  });

  describe('run()', () => {
    it('should key every emitted event by its id for the platform dedupe', async () => {
      const { store, token } = await enabled();
      const body = {
        ...SAMPLE_EVENT.activity,
        events: [
          { type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [] },
          { type: 'USER_SETTINGS', name: 'DELETE_USER', parameters: [] },
        ],
      };

      const items = await deliver({ store, token, body });

      expect(items).toHaveLength(2);
      expect(items.map((i) => i[DEDUPE_KEY_PROPERTY])).toEqual(items.map((i) => i['id']));
      expect(items.map((i) => i[DEDUPE_KEY_PROPERTY])).toEqual([`${SAMPLE_EVENT.id}:0`, `${SAMPLE_EVENT.id}:1`]);
    });

    it('should emit the first delivery with its dedupe key and drop a copy delivered minutes later', async () => {
      const { store, token } = await enabled();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);

      const first = await deliver({ store, token });
      vi.spyOn(Date, 'now').mockReturnValue(now + 5 * 60 * 1000);
      const delayed = await deliver({ store, token });

      expect(first).toEqual([expect.objectContaining({ id: SAMPLE_EVENT.id, [DEDUPE_KEY_PROPERTY]: SAMPLE_EVENT.id })]);
      expect(delayed).toEqual([]);
      expect(store.data.get(LEDGER_KEY)).toEqual({ entries: [[SAMPLE_EVENT.id, now]] });
    });

    it('should emit only the unseen events of a notification that repeats some of them', async () => {
      const { store, token } = await enabled();
      const single = { ...SAMPLE_EVENT.activity, events: [{ type: 'USER_SETTINGS', name: 'CREATE_USER', parameters: [] }] };
      const pair = { ...single, events: [...single.events, { type: 'USER_SETTINGS', name: 'DELETE_USER', parameters: [] }] };
      store.data.set(LEDGER_KEY, { entries: [[`${SAMPLE_EVENT.id}:0`, Date.now()]] });

      const items = await deliver({ store, token, body: pair });

      expect(items.map((i) => i[DEDUPE_KEY_PROPERTY])).toEqual([`${SAMPLE_EVENT.id}:1`]);
    });

    it('should only write the ledger key, and only when something new is emitted', async () => {
      const { store, token } = await enabled();
      store.put.mockClear();
      store.delete.mockClear();

      await deliver({ store, token });
      await deliver({ store, token });
      await deliver({ store, token, body: { ...SAMPLE_EVENT.activity, id: { ...SAMPLE_EVENT.activity.id, uniqueQualifier: 'other' } } });
      await deliver({ store, token: 'forged' });
      await deliver({ store, token, body: { ...SAMPLE_EVENT.activity, events: [{ type: 'USER_SETTINGS', name: 'IGNORED', parameters: [] }] } });
      await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token, 'x-goog-resource-state': 'sync' } }));

      expect(store.put.mock.calls.map(([key]) => key)).toEqual([LEDGER_KEY, LEDGER_KEY]);
      expect(store.delete).not.toHaveBeenCalled();
      expect([...store.data.keys()].sort()).toEqual([STORE_KEY, LEDGER_KEY].sort());
    });

    it('should prune ledger entries older than 24 hours so a much later redelivery runs again', async () => {
      const { store, token } = await enabled();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      await deliver({ store, token });

      vi.spyOn(Date, 'now').mockReturnValue(now + LEDGER_WINDOW_MS - 1);
      await expect(deliver({ store, token })).resolves.toEqual([]);

      const later = now + LEDGER_WINDOW_MS + 1;
      vi.spyOn(Date, 'now').mockReturnValue(later);
      const other = { ...SAMPLE_EVENT.activity, id: { ...SAMPLE_EVENT.activity.id, uniqueQualifier: 'other' } };
      await deliver({ store, token, body: other });

      expect(store.data.get(LEDGER_KEY)).toEqual({ entries: [[`${SAMPLE_EVENT.activity.id.time}:other`, later]] });
      await expect(deliver({ store, token })).resolves.toHaveLength(1);
    });

    it('should cap the ledger at the 2000 newest entries and stay far below the store value limit', async () => {
      const { store, token } = await enabled();
      const now = Date.now();
      const longId = (index: number) => `2026-10-05T12:34:56.789Z:-8721456339812345678:${index}`;
      store.data.set(LEDGER_KEY, { entries: Array.from({ length: LEDGER_CAP }, (_, index) => [longId(index), now - LEDGER_CAP + index]) });
      vi.spyOn(Date, 'now').mockReturnValue(now);

      await expect(deliver({ store, token })).resolves.toHaveLength(1);

      const { entries } = store.data.get(LEDGER_KEY) as { entries: [string, number][] };
      expect(entries).toHaveLength(LEDGER_CAP);
      expect(entries[0]).toEqual([longId(1), now - LEDGER_CAP + 1]);
      expect(entries.at(-1)).toEqual([SAMPLE_EVENT.id, now]);
      expect(entries.some(([id]) => id === longId(0))).toBe(false);
      expect(new TextEncoder().encode(JSON.stringify({ entries })).length).toBeLessThan(STORE_VALUE_LIMIT_BYTES / 2);
      await expect(deliver({ store, token, body: { ...SAMPLE_EVENT.activity } })).resolves.toEqual([]);
    });

    it('should turn a notification with the right token into events, applying the accept filter', async () => {
      const { store, token } = await enabled();
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

    it('should ignore the sync message and anything without a known channel token', async () => {
      const { store, token } = await enabled();

      await expect(hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token, 'x-goog-resource-state': 'sync' } }))).resolves.toEqual([]);
      await expect(deliver({ store, token: 'forged' })).resolves.toEqual([]);
      await expect(hooks.run(ctx(store, { headers: {}, body: SAMPLE_EVENT.activity }))).resolves.toEqual([]);
      await expect(deliver({ store: memoryStore(), token })).resolves.toEqual([]);
    });
  });

  describe('onRenew()', () => {
    it('should save the pending token before watch, then the channel with the previous token, then stop the old channel', async () => {
      const { store, token: oldToken } = await enabled();
      const first = store.data.get(STORE_KEY) as { id: string };
      store.put.mockClear();
      store.delete.mockClear();
      api.watch.mockImplementationOnce(async ({ channel }) => {
        expect(store.data.get(PENDING_KEY)).toBe(channel.token);
        expect(api.stop).not.toHaveBeenCalled();
        return { id: channel.id, resourceId: 'res-2', expiration: '1' };
      });

      await hooks.onRenew(ctx(store));

      const second = store.data.get(STORE_KEY) as { id: string; token: string; previousToken: string; resourceId: string };
      expect(second).toEqual(expect.objectContaining({ resourceId: 'res-2', previousToken: oldToken }));
      expect(second.id).not.toBe(first.id);
      expect(second.token).not.toBe(oldToken);
      expect(api.stop).toHaveBeenCalledTimes(1);
      expect(api.stop).toHaveBeenCalledWith({ auth: RESOLVED, channel: expect.objectContaining({ id: first.id, resourceId: 'res-1' }) });

      const pendingPut = store.put.mock.calls.findIndex(([key]) => key === PENDING_KEY);
      const channelPut = store.put.mock.calls.findIndex(([key]) => key === STORE_KEY);
      const watchOrder = api.watch.mock.invocationCallOrder[1] as number;
      const stopOrder = api.stop.mock.invocationCallOrder[0] as number;
      expect(store.put.mock.invocationCallOrder[pendingPut]).toBeLessThan(watchOrder);
      expect(watchOrder).toBeLessThan(store.put.mock.invocationCallOrder[channelPut] as number);
      expect(store.put.mock.invocationCallOrder[channelPut]).toBeLessThan(stopOrder);
      expect(store.delete.mock.invocationCallOrder[0]).toBeLessThan(stopOrder);
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });

    it('should accept deliveries with the pending token while the new channel is being opened', async () => {
      const { store } = await enabled();
      const delivered: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        delivered.push(await deliver({ store, token: channel.token }));
        return { id: channel.id, resourceId: 'res-2', expiration: '1' };
      });

      await hooks.onRenew(ctx(store));

      expect(delivered).toEqual([[expect.objectContaining({ id: SAMPLE_EVENT.id, [DEDUPE_KEY_PROPERTY]: SAMPLE_EVENT.id })]]);
    });

    it('should accept the pending token while the first channel is being opened on enable', async () => {
      const store = memoryStore();
      const delivered: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        delivered.push(await deliver({ store, token: channel.token }));
        return { id: channel.id, resourceId: 'res-1', expiration: '1' };
      });

      await hooks.onEnable(ctx(store));

      expect(delivered).toEqual([[expect.objectContaining({ id: SAMPLE_EVENT.id })]]);
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });

    it('should roll back the pending token and keep the old channel when watch fails', async () => {
      const { store, token } = await enabled();
      const before = structuredClone(store.data.get(STORE_KEY));
      let pendingToken = '';
      api.watch.mockImplementationOnce(async ({ channel }) => {
        pendingToken = channel.token;
        throw new Error('403 forbidden');
      });

      await expect(hooks.onRenew(ctx(store))).rejects.toThrow('403 forbidden');

      expect(store.data.has(PENDING_KEY)).toBe(false);
      expect(store.data.get(STORE_KEY)).toEqual(before);
      expect(api.stop).not.toHaveBeenCalled();
      await expect(deliver({ store, token: pendingToken })).resolves.toEqual([]);
      await expect(deliver({ store, token })).resolves.toHaveLength(1);
    });

    it('should accept the old channel token within the grace period and drop the copy from the new channel', async () => {
      const { store, token: oldToken } = await enabled();
      await hooks.onRenew(ctx(store));
      const { token: newToken } = store.data.get(STORE_KEY) as { token: string };

      const fromOld = await deliver({ store, token: oldToken });
      const fromNew = await deliver({ store, token: newToken });

      expect(fromOld).toHaveLength(1);
      expect(fromOld[0]?.[DEDUPE_KEY_PROPERTY]).toBe(SAMPLE_EVENT.id);
      expect(fromNew).toEqual([]);
    });

    it('should drop a straggler copy from the old channel delivered minutes after the new channel emitted it', async () => {
      const { store, token: oldToken } = await enabled();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      await hooks.onRenew(ctx(store));
      const { token: newToken } = store.data.get(STORE_KEY) as { token: string };

      const fromNew = await deliver({ store, token: newToken });
      vi.spyOn(Date, 'now').mockReturnValue(now + 10 * 60 * 1000);
      const fromOld = await deliver({ store, token: oldToken });

      expect(fromNew).toHaveLength(1);
      expect(fromOld).toEqual([]);
    });

    it('should keep the ledger across renewal', async () => {
      const { store, token } = await enabled();
      await deliver({ store, token });
      const ledger = structuredClone(store.data.get(LEDGER_KEY));

      await hooks.onRenew(ctx(store));

      expect(store.data.get(LEDGER_KEY)).toEqual(ledger);
    });

    it('should reject the old channel token once the grace period is over', async () => {
      const { store, token: oldToken } = await enabled();
      const now = Date.now();
      vi.spyOn(Date, 'now').mockReturnValue(now);
      await hooks.onRenew(ctx(store));

      vi.spyOn(Date, 'now').mockReturnValue(now + GRACE_MS - 1);
      await expect(deliver({ store, token: oldToken })).resolves.toHaveLength(1);
      vi.spyOn(Date, 'now').mockReturnValue(now + GRACE_MS);
      await expect(deliver({ store, token: oldToken })).resolves.toEqual([]);
    });
  });

  describe('enable and disable', () => {
    it('should start with an empty ledger and only keep the channel key on enable', async () => {
      const store = memoryStore();
      store.data.set(LEDGER_KEY, { entries: [[SAMPLE_EVENT.id, Date.now()]] });

      await hooks.onEnable(ctx(store));

      expect([...store.data.keys()]).toEqual([STORE_KEY]);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([LEDGER_KEY, PENDING_KEY]);
      const { token } = store.data.get(STORE_KEY) as { token: string };
      await expect(deliver({ store, token })).resolves.toHaveLength(1);
    });

    it('should stop the channel on disable, tolerate an expired one, and delete the channel, pending token and ledger', async () => {
      const { store, token } = await enabled();
      await deliver({ store, token });
      store.data.set(PENDING_KEY, 'stale');
      store.delete.mockClear();
      api.stop.mockRejectedValueOnce(new Error('404 notFound'));

      await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

      expect(api.stop).toHaveBeenCalledTimes(1);
      expect([...store.data.keys()]).toEqual([]);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([STORE_KEY, PENDING_KEY, LEDGER_KEY]);
    });
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
