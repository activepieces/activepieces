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
const MINUTE = 60 * 1000;
const GRACE_MS = 15 * MINUTE;
const HOUR = 60 * MINUTE;
const SKEW_MS = MINUTE;
const LIFETIME_MS = 6 * HOUR;
const NOW = Date.parse('2026-10-08T12:00:00.000Z');
const CUTOVER = NOW + SKEW_MS;
const OLD_EXPIRY = NOW - 4 * HOUR + LIFETIME_MS;

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
type StoredState = {
  id: string;
  resourceId: string;
  token: string;
  query: unknown;
  cutoverAt: string;
  previous?: { id: string; resourceId: string; token: string; validUntil: number };
};

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

  it('should open a channel to the webhook url on enable and remember it with its token and cutover instant', async () => {
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
    expect(state.query).toEqual({ application: 'admin', eventName: 'CREATE_USER' });
    expect(state.cutoverAt).toBe(new Date(CUTOVER).toISOString());
    expect(state.previous).toBeUndefined();
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

    it('should never write to the store, whatever is delivered', async () => {
      const { store, oldToken, newToken } = await renewed();
      store.put.mockClear();
      store.delete.mockClear();
      const before = structuredClone([...store.data.entries()]);

      await deliver({ store, token: newToken, body: activityAt({ time: NOW + MINUTE }).body });
      await deliver({ store, token: oldToken, body: activityAt({ time: NOW - MINUTE * 5 }).body });
      await deliver({ store, token: oldToken, body: activityAt({ time: NOW + MINUTE * 5 }).body });
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

    it('should accept every event, old or without a time, from the only channel before any renewal', async () => {
      at(NOW);
      const { store, token } = await enabled();

      await expect(deliver({ store, token, body: activityAt({ time: NOW - 3 * 60 * MINUTE }).body })).resolves.toHaveLength(1);
      await expect(deliver({ store, token, body: activityAt({ time: null }).body })).resolves.toHaveLength(1);
    });
  });

  describe('channel cutover', () => {
    it('should record the cutover one clock skew after the new channel watch returns', async () => {
      const { store, oldToken } = await renewed();

      expect(stored(store).cutoverAt).toBe(new Date(CUTOVER).toISOString());
      expect(stored(store).previous).toEqual(expect.objectContaining({ token: oldToken, validUntil: OLD_EXPIRY }));
    });

    it('should accept an activity one millisecond before the cutover only from the old channel', async () => {
      const { store, oldToken, newToken } = await renewed();
      const { body, eventId } = activityAt({ time: CUTOVER - 1 });
      at(CUTOVER + MINUTE);

      const fromOld = await deliver({ store, token: oldToken, body });
      const fromNew = await deliver({ store, token: newToken, body });

      expect(fromOld).toEqual([expect.objectContaining({ id: eventId, [DEDUPE_KEY_PROPERTY]: eventId })]);
      expect(fromNew).toEqual([]);
    });

    it('should accept an activity exactly at the cutover only from the new channel', async () => {
      const { store, oldToken, newToken } = await renewed();
      const { body, eventId } = activityAt({ time: CUTOVER });
      at(CUTOVER + MINUTE);

      const fromNew = await deliver({ store, token: newToken, body });
      const fromOld = await deliver({ store, token: oldToken, body });

      expect(fromNew).toEqual([expect.objectContaining({ id: eventId, [DEDUPE_KEY_PROPERTY]: eventId })]);
      expect(fromOld).toEqual([]);
    });

    it('should accept every activity around the cutover from exactly one channel, whenever it is delivered', async () => {
      const { store, oldToken, newToken } = await renewed();
      const deliveredAt = [NOW, CUTOVER, CUTOVER + 10 * MINUTE, OLD_EXPIRY - 1];

      for (const now of deliveredAt) {
        at(now);
        for (let time = CUTOVER - 3 * MINUTE; time <= CUTOVER + 3 * MINUTE; time += 997) {
          const { body } = activityAt({ time });
          const fromOld = await deliver({ store, token: oldToken, body });
          const fromNew = await deliver({ store, token: newToken, body });
          expect(fromOld.length + fromNew.length).toBe(1);
          expect(fromOld.length).toBe(time < CUTOVER ? 1 : 0);
        }
      }
    });

    it('should accept events without a time from the current channel only', async () => {
      const { store, oldToken, newToken } = await renewed();
      const { body } = activityAt({ time: null });

      await expect(deliver({ store, token: newToken, body })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: oldToken, body })).resolves.toEqual([]);
      const unparseable = { ...body, id: { ...body.id, time: 'not a date' } };
      await expect(deliver({ store, token: newToken, body: unparseable })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: oldToken, body: unparseable })).resolves.toEqual([]);
    });

    it('should keep the old channel token valid until the old channel expires', async () => {
      const { store, oldToken } = await renewed();
      const { body } = activityAt({ time: NOW - 5 * MINUTE });

      at(OLD_EXPIRY - 1);
      await expect(deliver({ store, token: oldToken, body })).resolves.toHaveLength(1);
      at(OLD_EXPIRY);
      await expect(deliver({ store, token: oldToken, body })).resolves.toEqual([]);
    });

    it('should fall back to a grace period for an old channel without a known expiration', async () => {
      at(NOW - 4 * HOUR);
      api.watch.mockImplementationOnce(async ({ channel }) => ({ id: channel.id, resourceId: 'res-old' }));
      const { store, token: oldToken } = await enabled();
      at(NOW);
      await hooks.onRenew(ctx(store));
      const { body } = activityAt({ time: NOW - 5 * MINUTE });

      expect(stored(store).cutoverAt).toBe(new Date(CUTOVER).toISOString());
      at(CUTOVER + GRACE_MS - 1);
      await expect(deliver({ store, token: oldToken, body })).resolves.toHaveLength(1);
      at(CUTOVER + GRACE_MS);
      await expect(deliver({ store, token: oldToken, body })).resolves.toEqual([]);
    });

    it('should accept a late activity older than the cutover from the new channel once the old one is gone', async () => {
      const { store, newToken } = await renewed();
      const { body } = activityAt({ time: NOW - 30 * MINUTE });

      at(OLD_EXPIRY - 1);
      await expect(deliver({ store, token: newToken, body })).resolves.toEqual([]);
      at(OLD_EXPIRY);
      await expect(deliver({ store, token: newToken, body })).resolves.toHaveLength(1);
    });

    it('should move the cutover back to the old channel expiry when it expires within the clock skew', async () => {
      const oldExpiry = NOW + 20 * 1000;
      at(NOW - 4 * HOUR);
      api.watch.mockImplementationOnce(async ({ channel }) => ({ id: channel.id, resourceId: 'res-old', expiration: String(oldExpiry) }));
      const { store, token: oldToken } = await enabled();
      at(NOW);
      await hooks.onRenew(ctx(store));
      const newToken = stored(store).token;

      expect(stored(store).cutoverAt).toBe(new Date(oldExpiry).toISOString());
      at(NOW + 10 * 1000);
      await expect(deliver({ store, token: oldToken, body: activityAt({ time: oldExpiry - 1 }).body })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: newToken, body: activityAt({ time: oldExpiry - 1 }).body })).resolves.toEqual([]);
      await expect(deliver({ store, token: newToken, body: activityAt({ time: oldExpiry }).body })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: oldToken, body: activityAt({ time: oldExpiry }).body })).resolves.toEqual([]);
    });

    it('should cut over as soon as the watch returns when the old channel has already expired', async () => {
      at(NOW - 7 * HOUR);
      const { store } = await enabled();
      at(NOW);
      await hooks.onRenew(ctx(store));

      expect(stored(store).cutoverAt).toBe(new Date(NOW).toISOString());
      await expect(deliver({ store, token: stored(store).token, body: activityAt({ time: NOW }).body })).resolves.toHaveLength(1);
    });

    it('should accept every activity, even before the cutover, from the new channel when the old one had already expired', async () => {
      at(NOW - 7 * HOUR);
      const { store, token: oldToken } = await enabled();
      at(NOW);
      await hooks.onRenew(ctx(store));
      const newToken = stored(store).token;

      expect(stored(store).previous).toBeUndefined();
      for (const time of [NOW - 30 * MINUTE, NOW - 1, NOW, null]) {
        const { body } = activityAt({ time });
        await expect(deliver({ store, token: newToken, body })).resolves.toHaveLength(1);
        await expect(deliver({ store, token: oldToken, body })).resolves.toEqual([]);
      }
    });
  });

  describe('onRenew()', () => {
    it('should save the pending token before watch, record the cutover after it, and keep the old channel open', async () => {
      at(NOW - 4 * HOUR);
      const { store, token: oldToken } = await enabled();
      const first = stored(store);
      store.put.mockClear();
      store.delete.mockClear();
      api.watch.mockImplementationOnce(async ({ channel }) => {
        expect(store.data.get(PENDING_KEY)).toBe(channel.token);
        at(NOW);
        return { id: channel.id, resourceId: 'res-2', expiration: String(channel.expiration) };
      });
      at(NOW - 5000);

      await hooks.onRenew(ctx(store));

      const second = stored(store);
      expect(second).toEqual(
        expect.objectContaining({
          resourceId: 'res-2',
          cutoverAt: new Date(CUTOVER).toISOString(),
          previous: { id: first.id, resourceId: 'res-1', token: oldToken, validUntil: OLD_EXPIRY },
        }),
      );
      expect(second.id).not.toBe(first.id);
      expect(second.token).not.toBe(oldToken);
      expect(api.stop).not.toHaveBeenCalled();

      const pendingPut = store.put.mock.calls.findIndex(([key]) => key === PENDING_KEY);
      const channelPut = store.put.mock.calls.findIndex(([key]) => key === STORE_KEY);
      const watchOrder = api.watch.mock.invocationCallOrder[1] as number;
      expect(store.put.mock.invocationCallOrder[pendingPut]).toBeLessThan(watchOrder);
      expect(watchOrder).toBeLessThan(store.put.mock.invocationCallOrder[channelPut] as number);
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });

    it('should stop the channel from two renewals ago once the next one is active', async () => {
      const { store } = await renewed();
      const { previous } = stored(store);

      at(NOW + 4 * HOUR);
      await hooks.onRenew(ctx(store));

      expect(api.stop).toHaveBeenCalledTimes(1);
      expect(api.stop).toHaveBeenCalledWith({ auth: RESOLVED, channel: { id: previous?.id, resourceId: 'res-1' } });
      const channelPut = store.put.mock.calls.map(([key]) => key).lastIndexOf(STORE_KEY);
      expect(store.put.mock.invocationCallOrder[channelPut]).toBeLessThan(api.stop.mock.invocationCallOrder[0] as number);
      expect(stored(store).previous?.resourceId).toBe('res-2');
    });

    it('should accept nothing on the pending token during a renewal, leaving it all to the old channel', async () => {
      at(NOW - 4 * HOUR);
      const { store, token: oldToken } = await enabled();
      at(NOW);
      const activities = [activityAt({ time: NOW }), activityAt({ time: NOW - 5 * MINUTE, qualifier: 'old' }), activityAt({ time: null, qualifier: 'none' })];
      const fromPending: unknown[][] = [];
      const fromOld: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        for (const { body } of activities) {
          fromPending.push(await deliver({ store, token: channel.token, body }));
          fromOld.push(await deliver({ store, token: oldToken, body }));
        }
        return { id: channel.id, resourceId: 'res-2', expiration: String(channel.expiration) };
      });

      await hooks.onRenew(ctx(store));

      expect(fromPending).toEqual([[], [], []]);
      expect(fromOld.map((items) => items.length)).toEqual([1, 1, 1]);
    });

    it('should accept everything on the pending token when the replacement opens after the stored channel expired', async () => {
      at(NOW - 7 * HOUR);
      const { store } = await enabled();
      at(NOW);
      const activities = [activityAt({ time: NOW }), activityAt({ time: NOW - 5 * MINUTE, qualifier: 'old' }), activityAt({ time: null, qualifier: 'none' })];
      const fromPending: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        for (const { body } of activities) {
          fromPending.push(await deliver({ store, token: channel.token, body }));
        }
        return { id: channel.id, resourceId: 'res-2', expiration: String(channel.expiration) };
      });

      await hooks.onRenew(ctx(store));

      expect(fromPending.map((items) => items.length)).toEqual([1, 1, 1]);
      expect(store.data.has(PENDING_KEY)).toBe(false);
    });

    it('should accept nothing on the pending token while a stored channel without a known expiration may still be live', async () => {
      at(NOW - 7 * HOUR);
      api.watch.mockImplementationOnce(async ({ channel }) => ({ id: channel.id, resourceId: 'res-1' }));
      const { store, token: oldToken } = await enabled();
      at(NOW);
      const fromPending: unknown[][] = [];
      api.watch.mockImplementationOnce(async ({ channel }) => {
        fromPending.push(await deliver({ store, token: channel.token }));
        return { id: channel.id, resourceId: 'res-2', expiration: String(channel.expiration) };
      });

      await hooks.onRenew(ctx(store));

      expect(fromPending).toEqual([[]]);
      expect(stored(store).previous?.token).toBe(oldToken);
    });

    it('should let the saved channel token win over a pending token that was not yet cleared', async () => {
      const { store, oldToken, newToken } = await renewed();
      store.data.set(PENDING_KEY, newToken);
      at(CUTOVER);

      await expect(deliver({ store, token: newToken, body: activityAt({ time: CUTOVER }).body })).resolves.toHaveLength(1);
      await expect(deliver({ store, token: newToken, body: activityAt({ time: CUTOVER - 1 }).body })).resolves.toEqual([]);
      await expect(deliver({ store, token: oldToken, body: activityAt({ time: CUTOVER - 1 }).body })).resolves.toHaveLength(1);
    });

    it('should accept everything on the pending token while the first channel is being opened on enable', async () => {
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
  });

  describe('enable and disable', () => {
    it('should stop any stale channels and start clean with only the channel key on enable', async () => {
      const { store } = await renewed();
      store.data.set(PENDING_KEY, 'stale');
      store.delete.mockClear();

      await hooks.onEnable(ctx(store));

      expect(api.stop.mock.calls.map(([params]) => params.channel.resourceId)).toEqual(['res-2', 'res-1']);
      expect([...store.data.keys()]).toEqual([STORE_KEY]);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([STORE_KEY, PENDING_KEY, PENDING_KEY]);
      expect(stored(store).previous).toBeUndefined();
      await expect(deliver({ store, token: stored(store).token })).resolves.toHaveLength(1);
    });

    it('should stop both channels on disable, tolerate an expired one, and delete only the channel and pending token', async () => {
      const { store } = await renewed();
      store.data.set(PENDING_KEY, 'stale');
      store.delete.mockClear();
      api.stop.mockRejectedValueOnce(new Error('404 notFound'));

      await expect(hooks.onDisable(ctx(store))).resolves.toBeUndefined();

      expect(api.stop.mock.calls.map(([params]) => params.channel.resourceId)).toEqual(['res-2', 'res-1']);
      expect([...store.data.keys()]).toEqual([]);
      expect(store.delete.mock.calls.map(([key]) => key)).toEqual([STORE_KEY, PENDING_KEY]);
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
