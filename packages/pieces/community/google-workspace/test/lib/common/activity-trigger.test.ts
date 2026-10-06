import { DEDUPE_KEY_PROPERTY } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  watch: vi.fn<(params: { auth: unknown; query: unknown; channel: { id: string; token: string; expiration: number } }) => Promise<unknown>>(),
  stop: vi.fn<(params: { auth: unknown; channel: { id: string; resourceId: string } }) => Promise<void>>(),
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
const PREVIOUS_KEY = 'google-workspace:previous-channel';
const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const IN_FLIGHT_MS = 2 * MINUTE;
const NOW = Date.parse('2026-10-08T12:00:00.000Z');

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

type MemoryStore = ReturnType<typeof memoryStore>;
type StoredState = { id: string; resourceId: string; token: string; expiration?: string; query: unknown };

const trigger = createActivityTrigger({
  name: 'testTrigger',
  classification: 'READ',
  displayName: 'Test',
  description: 'Test',
  aiMetadata: { description: 'Test' },
  props: {},
  query: () => ({ application: 'admin', eventName: 'CREATE_USER' }),
  accept: ({ event }) => event.eventName !== 'IGNORED',
});

type Hook = (ctx: unknown) => Promise<unknown>;
const hooks = trigger as unknown as { onEnable: Hook; onRenew: Hook; onDisable: Hook; run: Hook; test: Hook };

function ctx(store: MemoryStore, payload?: { headers?: Record<string, string>; body?: unknown }) {
  return { auth: AUTH, propsValue: {}, store, webhookUrl: WEBHOOK_URL, payload: { headers: {}, body: undefined, queryParams: {}, ...payload } };
}

function deliver({ store, token, body = SAMPLE_EVENT.activity }: { store: MemoryStore; token: string; body?: unknown }) {
  return hooks.run(ctx(store, { headers: { 'x-goog-channel-token': token }, body })) as Promise<Record<string, unknown>[]>;
}

function at(time: number) {
  vi.spyOn(Date, 'now').mockReturnValue(time);
}

function activityAt({ time, qualifier = 'q' }: { time: number | null; qualifier?: string }) {
  const id = { ...SAMPLE_EVENT.activity.id, uniqueQualifier: qualifier, time: time === null ? undefined : new Date(time).toISOString() };
  return { body: { ...SAMPLE_EVENT.activity, id }, eventId: `${id.time ?? ''}:${qualifier}` };
}

function stored(store: MemoryStore): StoredState {
  return store.data.get(STORE_KEY) as StoredState;
}

let resourceCounter = 0;

async function enabled() {
  const store = memoryStore();
  await hooks.onEnable(ctx(store));
  return { store, token: stored(store).token };
}

async function renewed() {
  at(NOW - 4 * HOUR);
  const { store, token: oldToken } = await enabled();
  at(NOW);
  await hooks.onRenew(ctx(store));
  return { store, oldToken, newToken: stored(store).token };
}

beforeEach(() => {
  vi.restoreAllMocks();
  resourceCounter = 0;
  api.watch.mockReset().mockImplementation(async ({ channel }) => {
    resourceCounter += 1;
    return { id: channel.id, resourceId: `res-${resourceCounter}`, expiration: String(channel.expiration) };
  });
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

  describe('onEnable()', () => {
    it('should open a channel to the webhook url and remember it with its token', async () => {
      at(NOW);
      const { store } = await enabled();

      expect(api.watch).toHaveBeenCalledWith({
        auth: RESOLVED,
        query: { application: 'admin', eventName: 'CREATE_USER' },
        channel: expect.objectContaining({ address: WEBHOOK_URL, id: expect.any(String), token: expect.any(String), expiration: expect.any(Number) }),
      });
      const state = stored(store);
      expect(state.resourceId).toBe('res-1');
      expect(state.token).toMatch(/^[0-9a-f-]{36}$/);
      expect(state.expiration).toEqual(expect.any(String));
      expect(state.query).toEqual({ application: 'admin', eventName: 'CREATE_USER' });
      expect([...store.data.keys()]).toEqual([STORE_KEY]);
      expect(api.stop).not.toHaveBeenCalled();
    });

    it('should stop a stale channel and start clean with only the channel key', async () => {
      const { store, oldToken, newToken } = await renewed();
      store.data.set(PENDING_KEY, 'stale');
      store.delete.mockClear();
      api.stop.mockClear();

      await hooks.onEnable(ctx(store));

      expect(api.stop.mock.calls.map(([params]) => params.channel.resourceId)).toEqual(['res-2']);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([STORE_KEY, PENDING_KEY, PREVIOUS_KEY, PENDING_KEY]);
      expect([...store.data.keys()]).toEqual([STORE_KEY]);
      await expect(deliver({ store, token: stored(store).token })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: oldToken })).resolves.toEqual([]);
      await expect(deliver({ store, token: newToken })).resolves.toEqual([]);
    });

    it('should accept the pending token while the first channel is being opened', async () => {
      const store = memoryStore();
      const delivered: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        delivered.push(await deliver({ store, token: channel.token }));
        delivered.push(await deliver({ store, token: channel.token, body: activityAt({ time: null }).body }));
        return { id: channel.id, resourceId: 'res-1', expiration: String(channel.expiration) };
      });

      await hooks.onEnable(ctx(store));

      expect(delivered).toEqual([[expect.objectContaining({ id: SAMPLE_EVENT.id })], [expect.anything()]]);
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });
  });

  describe('onRenew()', () => {
    it('should save the pending token, watch, save the new channel, drop the pending token, then stop the old channel', async () => {
      at(NOW - 4 * HOUR);
      const { store, token: oldToken } = await enabled();
      const first = stored(store);
      store.put.mockClear();
      store.delete.mockClear();
      at(NOW);

      await hooks.onRenew(ctx(store));

      const second = stored(store);
      expect(second).toEqual(expect.objectContaining({ resourceId: 'res-2', expiration: expect.any(String) }));
      expect(second.id).not.toBe(first.id);
      expect(second.token).not.toBe(oldToken);
      expect(api.stop).toHaveBeenCalledTimes(1);
      expect(api.stop).toHaveBeenCalledWith({ auth: RESOLVED, channel: { id: first.id, resourceId: 'res-1' } });
      expect(store.data.get(PREVIOUS_KEY)).toEqual({ previousToken: oldToken, previousStoppedAt: NOW });
      expect(store.data.has(PENDING_KEY)).toBe(false);

      const putOrder = (key: string) => store.put.mock.invocationCallOrder[store.put.mock.calls.findIndex(([k]) => k === key)] as number;
      const deleteOrder = (key: string) => store.delete.mock.invocationCallOrder[store.delete.mock.calls.findIndex(([k]) => k === key)] as number;
      const sequence = [
        putOrder(PENDING_KEY),
        api.watch.mock.invocationCallOrder[1] as number,
        putOrder(STORE_KEY),
        deleteOrder(PENDING_KEY),
        api.stop.mock.invocationCallOrder[0] as number,
      ];
      expect(sequence).toEqual([...sequence].sort((a, b) => a - b));
      expect(putOrder(PREVIOUS_KEY)).toBeLessThan(putOrder(STORE_KEY));
    });

    it('should accept the pending token and the old token while watch is in flight', async () => {
      at(NOW - 4 * HOUR);
      const { store, token: oldToken } = await enabled();
      at(NOW);
      const fromPending: unknown[][] = [];
      const fromOld: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        fromPending.push(await deliver({ store, token: channel.token, body: activityAt({ time: NOW }).body }));
        fromOld.push(await deliver({ store, token: oldToken, body: activityAt({ time: NOW - 5 * MINUTE }).body }));
        return { id: channel.id, resourceId: 'res-2', expiration: String(channel.expiration) };
      });

      await hooks.onRenew(ctx(store));

      expect(fromPending.map((items) => items.length)).toEqual([1]);
      expect(fromOld.map((items) => items.length)).toEqual([1]);
    });

    it('should accept the old token while the old channel is being stopped', async () => {
      at(NOW - 4 * HOUR);
      const { store, token: oldToken } = await enabled();
      at(NOW);
      const duringStop: unknown[][] = [];
      api.stop.mockImplementationOnce(async () => {
        duringStop.push(await deliver({ store, token: oldToken }));
      });

      await hooks.onRenew(ctx(store));

      expect(duringStop.map((items) => items.length)).toEqual([1]);
    });

    it('should roll back the pending token, keep the old channel state and not stop it when watch fails', async () => {
      const { store, token } = await enabled();
      const before = structuredClone([...store.data.entries()]);
      let pendingToken = '';
      api.watch.mockImplementationOnce(async ({ channel }) => {
        pendingToken = channel.token;
        throw new Error('403 forbidden');
      });

      await expect(hooks.onRenew(ctx(store))).rejects.toThrow('403 forbidden');

      expect([...store.data.entries()]).toEqual(before);
      expect(api.stop).not.toHaveBeenCalled();
      await expect(deliver({ store, token: pendingToken })).resolves.toEqual([]);
      await expect(deliver({ store, token })).resolves.toHaveLength(1);
    });

    it('should tolerate an old channel that is already expired or gone', async () => {
      at(NOW - 4 * HOUR);
      const { store } = await enabled();
      at(NOW);
      api.stop.mockRejectedValueOnce(new Error('404 notFound'));

      await expect(hooks.onRenew(ctx(store))).resolves.toBeUndefined();

      expect(stored(store).resourceId).toBe('res-2');
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });

    it('should stop only the channel being replaced on consecutive renewals', async () => {
      const { store, newToken } = await renewed();
      api.stop.mockClear();

      at(NOW + 4 * HOUR);
      await hooks.onRenew(ctx(store));

      expect(api.stop.mock.calls.map(([params]) => params.channel.resourceId)).toEqual(['res-2']);
      expect(store.data.get(PREVIOUS_KEY)).toEqual({ previousToken: newToken, previousStoppedAt: NOW + 4 * HOUR });
    });
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

    it('should key events from the current and the previous channel the same way so the overlap collapses', async () => {
      const { store, oldToken, newToken } = await renewed();
      const { body, eventId } = activityAt({ time: NOW });

      const fromNew = await deliver({ store, token: newToken, body });
      const fromOld = await deliver({ store, token: oldToken, body });

      expect(fromNew).toEqual([expect.objectContaining({ id: eventId, [DEDUPE_KEY_PROPERTY]: eventId })]);
      expect(fromOld).toEqual(fromNew);
    });

    it('should never write to the store, whatever is delivered', async () => {
      const { store, oldToken, newToken } = await renewed();
      store.put.mockClear();
      store.delete.mockClear();
      const before = structuredClone([...store.data.entries()]);

      await deliver({ store, token: newToken, body: activityAt({ time: NOW + MINUTE }).body });
      await deliver({ store, token: oldToken, body: activityAt({ time: NOW - 5 * MINUTE }).body });
      at(NOW + IN_FLIGHT_MS);
      await deliver({ store, token: oldToken });
      await deliver({ store, token: 'forged' });
      await deliver({ store, token: newToken, body: { ...SAMPLE_EVENT.activity, events: [{ type: 'USER_SETTINGS', name: 'IGNORED', parameters: [] }] } });
      await hooks.run(ctx(store, { headers: { 'x-goog-channel-token': newToken, 'x-goog-resource-state': 'sync' } }));

      expect(store.put).not.toHaveBeenCalled();
      expect(store.delete).not.toHaveBeenCalled();
      expect([...store.data.entries()]).toEqual(before);
    });

    it('should emit a retried delivery again so a failed submission loses nothing', async () => {
      const { store, token } = await enabled();

      const first = await deliver({ store, token });
      const retried = await deliver({ store, token });

      expect(first).toEqual([expect.objectContaining({ id: SAMPLE_EVENT.id, [DEDUPE_KEY_PROPERTY]: SAMPLE_EVENT.id })]);
      expect(retried).toEqual(first);
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

    it('should accept every activity from the current channel whatever its time, late logs included', async () => {
      const { store, newToken } = await renewed();

      for (const deliveredAt of [NOW, NOW + 30 * MINUTE, NOW + 3 * HOUR]) {
        at(deliveredAt);
        for (const time of [NOW - 5 * HOUR, NOW - 30 * MINUTE, NOW - 1, NOW, NOW + 10 * MINUTE, null]) {
          await expect(deliver({ store, token: newToken, body: activityAt({ time }).body })).resolves.toHaveLength(1);
        }
      }
    });

    it('should accept the previous channel token only within the in-flight window after it was stopped', async () => {
      const { store, oldToken } = await renewed();
      const late = activityAt({ time: NOW - 30 * MINUTE }).body;

      at(NOW + IN_FLIGHT_MS - 1);
      await expect(deliver({ store, token: oldToken, body: late })).resolves.toHaveLength(1);
      at(NOW + IN_FLIGHT_MS);
      await expect(deliver({ store, token: oldToken, body: late })).resolves.toEqual([]);
    });

    it('should reject the token of a channel replaced two renewals ago', async () => {
      const { store, oldToken } = await renewed();
      at(NOW + 4 * HOUR);
      await hooks.onRenew(ctx(store));

      await expect(deliver({ store, token: oldToken })).resolves.toEqual([]);
    });
  });

  describe('onDisable()', () => {
    it('should stop the current channel and delete the channel, pending and previous keys', async () => {
      const { store } = await renewed();
      store.data.set(PENDING_KEY, 'stale');
      store.delete.mockClear();
      api.stop.mockClear();

      await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

      expect(api.stop.mock.calls.map(([params]) => params.channel.resourceId)).toEqual(['res-2']);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([STORE_KEY, PENDING_KEY, PREVIOUS_KEY]);
      expect([...store.data.keys()]).toEqual([]);
    });

    it('should tolerate a channel that is already expired', async () => {
      const { store } = await enabled();
      api.stop.mockRejectedValueOnce(new Error('404 notFound'));

      await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

      expect([...store.data.keys()]).toEqual([]);
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
