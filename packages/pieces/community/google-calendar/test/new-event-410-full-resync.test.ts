import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent as trigger } from '../src/lib/triggers/new-event';

const SYNC_TOKEN_KEY = 'google_calendar_sync_token';
const STATE_KEY = 'google_calendar_new_event_state';
const PAGE_SIZE = 60;

const google: FakeGoogle = {
  version: 0,
  events: new Map<string, { version: number; event: VendorEvent }>(),
  channelId: '',
  expireNextIncremental: false,
  failFullListings: 0,
  fullListingsWithItems: 0,
  slowPageMs: 0,
  listingTimeouts: [],
};

beforeEach(() => {
  google.version = 0;
  google.events.clear();
  google.channelId = '';
  google.expireNextIncremental = false;
  google.failFullListings = 0;
  google.fullListingsWithItems = 0;
  google.slowPageMs = 0;
  google.listingTimeouts = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeGoogle, undefined, [request]));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('New Event after Google invalidates the sync token (410)', () => {
  it('fires every event created during a burst exactly once when the first push gets 410', async () => {
    const { store, data } = memoryStore();
    seedEvents({ prefix: 'before', count: 50, createdAt: daysAgo({ days: 3 }) });
    await trigger.onEnable(hookContext({ store }));

    seedEvents({ prefix: 'burst', count: 100 });
    google.expireNextIncremental = true;
    const fired = await push({ store });

    const ids = fired.map(idOf);
    expect(ids).toHaveLength(100);
    expect(new Set(ids).size).toBe(100);
    expect(ids.every((id) => id.startsWith('burst-'))).toBe(true);
    expect(fired.every((item) => isRecord(item) && item[DEDUPE_KEY_PROPERTY] === item['id'])).toBe(true);
    expect(google.fullListingsWithItems).toBe(1);
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(`tok-${google.version}`);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('[google-calendar] new_event: '));

    expect(await push({ store })).toEqual([]);
  });

  it('fires only the events that were not seen yet when 410 comes after some already fired', async () => {
    const { store } = memoryStore();
    seedEvents({ prefix: 'before', count: 5, createdAt: daysAgo({ days: 3 }) });
    await trigger.onEnable(hookContext({ store }));

    seedEvents({ prefix: 'first', count: 3 });
    expect((await push({ store })).map(idOf)).toEqual(['first-0', 'first-1', 'first-2']);

    seedEvents({ prefix: 'second', count: 4 });
    google.expireNextIncremental = true;
    expect((await push({ store })).map(idOf).sort()).toEqual(['second-0', 'second-1', 'second-2', 'second-3']);
    expect(await push({ store })).toEqual([]);
  });

  it('fires only the invitation received after turn-on, not one already waiting or one answered', async () => {
    const { store } = memoryStore();
    putEvent({
      id: 'waiting-invite',
      createdAt: daysAgo({ days: 10 }),
      updatedAt: daysAgo({ days: 10 }),
      extra: inviteFields({ responseStatus: 'needsAction' }),
    });
    await trigger.onEnable(hookContext({ store }));

    putEvent({ id: 'answered-invite', createdAt: daysAgo({ days: 1 }), extra: inviteFields({ responseStatus: 'accepted' }) });
    putEvent({ id: 'declined-invite', extra: inviteFields({ responseStatus: 'declined' }) });
    putEvent({ id: 'new-invite', createdAt: daysAgo({ days: 30 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    google.expireNextIncremental = true;

    expect((await push({ store })).map(idOf)).toEqual(['new-invite']);
    expect(await push({ store })).toEqual([]);
  });

  it('stops the full listing at the time budget, fires what it listed, re-syncs from now and logs the skipped window', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.parse('2026-11-01T10:00:00.000Z'));
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    seedEvents({ prefix: 'burst', count: 4 * PAGE_SIZE });
    google.expireNextIncremental = true;
    google.slowPageMs = 8_000;
    const fired = (await push({ store })).map(idOf);

    expect(fired).toHaveLength(2 * PAGE_SIZE);
    expect(new Set(fired).size).toBe(2 * PAGE_SIZE);
    expect(google.listingTimeouts).toEqual([10_000, 10_000]);
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(`tok-${google.version}`);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('did not finish within 25 s'));
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));

    google.slowPageMs = 0;
    expect(await push({ store })).toEqual([]);
    expect(google.fullListingsWithItems).toBe(1);
  });

  it('throws and keeps the stored sync token when the full listing after 410 fails', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const tokenBefore = stored({ data, key: SYNC_TOKEN_KEY });

    seedEvents({ prefix: 'burst', count: 3 });
    google.expireNextIncremental = true;
    google.failFullListings = 1;

    await expect(push({ store })).rejects.toThrow();
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(tokenBefore);

    google.expireNextIncremental = true;
    expect((await push({ store })).map(idOf).sort()).toEqual(['burst-0', 'burst-1', 'burst-2']);
  });

  it('does not fire filtered events on the full re-sync but remembers them as seen', async () => {
    const { store, data } = memoryStore();
    const props = { search_filter: 'standup', exclude_all_day: true };
    await trigger.onEnable(hookContext({ store, props }));

    putEvent({ id: 'daily-standup', extra: { summary: 'Daily standup' } });
    putEvent({ id: 'lunch', extra: { summary: 'Lunch' } });
    putEvent({ id: 'standup-offsite', extra: { summary: 'Standup offsite', start: { date: '2026-11-20' }, end: { date: '2026-11-21' } } });
    google.expireNextIncremental = true;

    expect((await push({ store, props })).map(idOf)).toEqual(['daily-standup']);
    const seenIds = seenEntries({ data }).sort();
    expect(seenIds).toEqual(['daily-standup', 'lunch', 'standup-offsite']);

    editEvent({ id: 'lunch', changes: { summary: 'Standup over lunch' } });
    expect(await push({ store, props })).toEqual([]);
  });

  it('keeps the old sync token when judging fails on the full re-sync, so the retry still fires the burst', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const tokenBefore = stored({ data, key: SYNC_TOKEN_KEY });
    expect(tokenBefore).not.toBeNull();
    const failing = memoryStoreView({ data, failPutOnce: STATE_KEY });

    seedEvents({ prefix: 'burst', count: 4 });
    google.expireNextIncremental = true;
    await expect(push({ store: failing })).rejects.toThrow('store put failed');
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(tokenBefore);

    google.expireNextIncremental = true;
    expect((await push({ store })).map(idOf).sort()).toEqual(['burst-0', 'burst-1', 'burst-2', 'burst-3']);
    expect(await push({ store })).toEqual([]);
  });

  it('keeps the old sync token when judging fails on a normal push, so the retry still fires the new events', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const tokenBefore = stored({ data, key: SYNC_TOKEN_KEY });
    const failing = memoryStoreView({ data, failPutOnce: STATE_KEY });

    seedEvents({ prefix: 'new', count: 2 });
    await expect(push({ store: failing })).rejects.toThrow('store put failed');
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(tokenBefore);

    expect((await push({ store })).map(idOf).sort()).toEqual(['new-0', 'new-1']);
    expect(await push({ store })).toEqual([]);
  });

  it('still returns the burst when saving the sync token fails after the full re-sync, and the retry fires nothing more', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const tokenBefore = stored({ data, key: SYNC_TOKEN_KEY });
    const failing = memoryStoreView({ data, failPutOnce: SYNC_TOKEN_KEY });

    seedEvents({ prefix: 'burst', count: 3 });
    google.expireNextIncremental = true;
    expect((await push({ store: failing })).map(idOf).sort()).toEqual(['burst-0', 'burst-1', 'burst-2']);
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(tokenBefore);
    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('could not save the sync token'), expect.anything());

    google.expireNextIncremental = true;
    expect(await push({ store })).toEqual([]);
    expect(await push({ store })).toEqual([]);
  });

  it('still returns the new events when saving the sync token fails on a normal push, and the retry fires nothing more', async () => {
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const tokenBefore = stored({ data, key: SYNC_TOKEN_KEY });
    const failing = memoryStoreView({ data, failPutOnce: SYNC_TOKEN_KEY });

    seedEvents({ prefix: 'new', count: 2 });
    expect((await push({ store: failing })).map(idOf).sort()).toEqual(['new-0', 'new-1']);
    expect(stored({ data, key: SYNC_TOKEN_KEY })).toBe(tokenBefore);

    expect(await push({ store })).toEqual([]);
    expect(stored({ data, key: SYNC_TOKEN_KEY })).not.toBe(tokenBefore);
  });

  it('does not fire an old event edited after turn-on, a cancelled event, or a series occurrence on the full re-sync', async () => {
    const { store } = memoryStore();
    putEvent({ id: 'old-edited', createdAt: daysAgo({ days: 5 }), updatedAt: daysAgo({ days: 5 }) });
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'old-edited', changes: { summary: 'Renamed after turn-on' } });
    putEvent({ id: 'cancelled-new', extra: { status: 'cancelled' } });
    putEvent({ id: 'series', extra: { recurrence: ['RRULE:FREQ=DAILY'] } });
    putEvent({ id: 'series_20261121T100000Z', extra: { recurringEventId: 'series', summary: 'Moved occurrence' } });
    putEvent({ id: 'brand-new' });
    google.expireNextIncremental = true;

    expect((await push({ store })).map(idOf).sort()).toEqual(['brand-new', 'series']);
    expect(await push({ store })).toEqual([]);
  });

  it('does not re-fire an invitation already fired, and fires a whole-series invitation once as the series', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    putEvent({ id: 'early-invite', extra: inviteFields({ responseStatus: 'needsAction' }) });
    expect((await push({ store })).map(idOf)).toEqual(['early-invite']);

    putEvent({ id: 'team-series', extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurrence: ['RRULE:FREQ=WEEKLY'] } });
    putEvent({
      id: 'team-series_20261127T100000Z',
      extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'team-series' },
    });
    google.expireNextIncremental = true;

    expect((await push({ store })).map(idOf)).toEqual(['team-series']);
    expect(await push({ store })).toEqual([]);
  });

  it('fires all 700 events of a big burst once on the full re-sync and none again after the seen list is cut', async () => {
    const { store, data } = memoryStore();
    seedEvents({ prefix: 'before', count: 30, createdAt: daysAgo({ days: 2 }) });
    await trigger.onEnable(hookContext({ store }));

    const baseMs = Date.now() + 1000;
    for (let index = 0; index < 700; index += 1) {
      const at = new Date(baseMs + index).toISOString();
      putEvent({ id: `big-${index}`, createdAt: at, updatedAt: at });
    }
    google.expireNextIncremental = true;
    const fired = (await push({ store })).map(idOf);
    expect(fired).toHaveLength(700);
    expect(new Set(fired).size).toBe(700);
    expect(seenEntries({ data })).toHaveLength(500);

    google.expireNextIncremental = true;
    expect(await push({ store })).toEqual([]);

    editEvent({ id: 'big-0', changes: { summary: 'Edited oldest' } });
    editEvent({ id: 'big-699', changes: { summary: 'Edited newest' } });
    expect(await push({ store })).toEqual([]);
  });
});

function seedEvents({ prefix, count, createdAt }: { prefix: string; count: number; createdAt?: string }): void {
  for (let index = 0; index < count; index += 1) {
    putEvent({ id: `${prefix}-${index}`, createdAt, updatedAt: createdAt });
  }
}

function putEvent({ id, createdAt, updatedAt, extra }: { id: string; createdAt?: string; updatedAt?: string; extra?: Partial<VendorEvent> }): void {
  google.version += 1;
  const now = new Date().toISOString();
  google.events.set(id, {
    version: google.version,
    event: {
      kind: 'calendar#event',
      id,
      status: 'confirmed',
      summary: `Meeting ${id}`,
      created: createdAt ?? now,
      updated: updatedAt ?? now,
      eventType: 'default',
      start: { dateTime: '2026-11-20T10:00:00Z' },
      end: { dateTime: '2026-11-20T11:00:00Z' },
      ...extra,
    },
  });
}

function editEvent({ id, changes }: { id: string; changes: Partial<VendorEvent> }): void {
  const current = google.events.get(id);
  if (!current) {
    throw new Error(`no event ${id}`);
  }
  google.version += 1;
  google.events.set(id, {
    version: google.version,
    event: { ...current.event, ...changes, updated: new Date().toISOString() },
  });
}

function inviteFields({ responseStatus }: { responseStatus: string }): Partial<VendorEvent> {
  return {
    organizer: { email: 'organizer@other.example.com', self: false },
    attendees: [
      { email: 'organizer@other.example.com', responseStatus: 'accepted' },
      { email: 'me@example.com', self: true, responseStatus },
    ],
  };
}

function daysAgo({ days }: { days: number }): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

async function fakeGoogle(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const fail = (status: number) => new HttpError(request.body, { status, responseBody: { error: { code: status } } });
  const body = isRecord(request.body) ? request.body : {};
  if (request.url.endsWith('/events/watch')) {
    google.channelId = String(body['id']);
    return { status: 200, headers: {}, body: { kind: 'api#channel', id: google.channelId, resourceId: 'res-primary', expiration: String(body['expiration']) } };
  }
  if (request.url.endsWith('/channels/stop')) {
    return { status: 200, headers: {}, body: '' };
  }
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  const syncToken = params['syncToken'];
  if (syncToken !== undefined) {
    if (google.expireNextIncremental) {
      google.expireNextIncremental = false;
      throw fail(410);
    }
    const since = Number(syncToken.replace('tok-', ''));
    const items = Array.from(google.events.values()).filter((entry) => entry.version > since).map((entry) => entry.event);
    return { status: 200, headers: {}, body: { kind: 'calendar#events', items, nextSyncToken: `tok-${google.version}` } };
  }
  if (google.failFullListings > 0) {
    google.failFullListings -= 1;
    throw fail(503);
  }
  const offset = params['pageToken'] === undefined ? 0 : Number(params['pageToken'].replace('page-', ''));
  const all = Array.from(google.events.values()).map((entry) => entry.event);
  const pageItems = all.slice(offset, offset + PAGE_SIZE);
  const hasMore = offset + PAGE_SIZE < all.length;
  if (params['fields'] === undefined && offset === 0) {
    google.fullListingsWithItems += 1;
  }
  if (params['fields'] === undefined && google.slowPageMs > 0) {
    google.listingTimeouts.push(request.timeout ?? 0);
    vi.setSystemTime(Date.now() + google.slowPageMs);
  }
  const page: Record<string, unknown> = { kind: 'calendar#events' };
  if (params['fields'] === undefined) {
    page['items'] = pageItems;
  }
  if (hasMore) {
    page['nextPageToken'] = `page-${offset + PAGE_SIZE}`;
  } else {
    page['nextSyncToken'] = `tok-${google.version}`;
  }
  return { status: 200, headers: {}, body: page };
}

async function push({ store, props }: { store: Store; props?: Partial<TriggerProps> }): Promise<unknown[]> {
  const headers = { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': google.channelId, 'x-goog-resource-id': 'res-primary' };
  return trigger.run(hookContext({ store, headers, props }));
}

function stored({ data, key }: { data: Map<string, string>; key: string }): unknown {
  const raw = data.get(key);
  return raw === undefined ? null : JSON.parse(raw);
}

function seenEntries({ data }: { data: Map<string, string> }): string[] {
  const state = stored({ data, key: STATE_KEY });
  const value = isRecord(state) ? state['seen'] : null;
  return Array.isArray(value) ? value.map(idOf) : [];
}

function memoryStore(): { store: Store; data: Map<string, string> } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}

function memoryStoreView({ data, failPutOnce }: { data: Map<string, string>; failPutOnce: string }): Store {
  const pending: { failPutOnce: string | undefined } = { failPutOnce };
  return {
    async put<T>(key: string, value: T): Promise<T> {
      if (pending.failPutOnce === key) {
        pending.failPutOnce = undefined;
        throw new Error(`store put failed for ${key}`);
      }
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

function hookContext({ store, headers, props }: { store: Store; headers?: Record<string, string>; props?: Partial<TriggerProps> }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, headers, props }]);
}

function fakeContext({ store, headers, props }: { store: Store; headers?: Record<string, string>; props?: Partial<TriggerProps> }) {
  return {
    store,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: 'primary', event_types: undefined, search_filter: undefined, exclude_all_day: false, ...props },
    webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
    payload: { headers: headers ?? {}, body: {}, queryParams: {} },
    files: {},
  };
}

function idOf(item: unknown): string {
  return isRecord(item) ? String(item['id']) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

type TriggerProps = {
  search_filter: string;
  exclude_all_day: boolean;
};

type FakeGoogle = {
  version: number;
  events: Map<string, { version: number; event: VendorEvent }>;
  channelId: string;
  expireNextIncremental: boolean;
  failFullListings: number;
  fullListingsWithItems: number;
  slowPageMs: number;
  listingTimeouts: number[];
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  eventType: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  recurringEventId?: string;
  recurrence?: string[];
  organizer?: { email: string; self?: boolean };
  attendees?: { email: string; self?: boolean; responseStatus: string }[];
};
