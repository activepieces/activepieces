import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarEventChanged as trigger } from '../src/lib/triggers/calendar-event';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const CHECKPOINT_KEY = 'new_or_updated_checkpoint';

const vendor: FakeVendorState = {
  events: new Map<string, VendorEvent>(),
  requests: [],
  latencyMs: 0,
  failures: [],
  goneAfterDays: 0,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

beforeEach(() => {
  vendor.events.clear();
  vendor.requests = [];
  vendor.latencyMs = 0;
  vendor.failures = [];
  vendor.goneAfterDays = 0;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('New or Updated Event behaviour', () => {
  it('fires each add and edit once, never a delete, across polls and a republish', async () => {
    createEvent({ id: 'old' });
    createEvent({ id: 'to-edit' });
    createEvent({ id: 'to-delete' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);

    createEvent({ id: 'added' });
    editEvent({ id: 'to-edit' });
    deleteEvent({ id: 'to-delete' });
    expect(await poll({ store })).toEqual(['added', 'to-edit']);
    expect(await poll({ store })).toEqual([]);

    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(await poll({ store })).toEqual([]);
  });

  it('fires again once when an event it already fired is edited later', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'meeting' });
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['meeting']);
    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);

    editEvent({ id: 'meeting' });
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['meeting']);
    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
  });

  it('fires both events that share one timestamp when the second becomes visible later', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'tie-a' });
    const shared = eventById({ id: 'tie-a' }).updated;
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['tie-a']);

    vendor.events.set('tie-b', { ...eventById({ id: 'tie-a' }), id: 'tie-b', created: shared, updated: shared });
    expect(await quickPoll({ store, seconds: 10 })).toEqual(['tie-b']);
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps up on a quiet calendar for longer than Google accepts as updatedMin and fires the next change once', async () => {
    vendor.goneAfterDays = 20;
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const enabledAt = clock;
    while (clock < enabledAt + 21 * DAY) {
      tick(60);
      expect(await poll({ store })).toEqual([]);
    }

    createEvent({ id: 'later' });
    expect(await poll({ store })).toEqual(['later']);
    expect(await poll({ store })).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('re-baselines and logs when a switched-off flow is older than Google accepts', async () => {
    vendor.goneAfterDays = 20;
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    clock += 30 * DAY;
    createEvent({ id: 'during-gap' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await poll({ store })).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));
    expect(checkpointOf({ data }).scannedThroughMs).toBe(clock + 1);

    createEvent({ id: 'after' });
    expect(await poll({ store })).toEqual(['after']);
    expect(await poll({ store })).toEqual([]);
  });

  it('stops paging before the listing budget and finishes on the next poll without losing or repeating a change', async () => {
    for (let index = 0; index < 3000; index++) {
      createEvent({ id: `bulk-${index}`, at: clock - 30 * DAY });
    }
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    editRange({ from: 0, count: 3000 });
    vendor.latencyMs = 16_000;
    tick(5);

    const startedAt = clock;
    const first = (await trigger.run(hookContext({ store }))).map(idOf);
    expect(clock - startedAt).toBeLessThan(25_000);

    vendor.latencyMs = 0;
    const second = await poll({ store });
    const third = await poll({ store });
    const all = [...first, ...second, ...third];
    expect(first).toHaveLength(2500);
    expect(second).toHaveLength(500);
    expect(all).toHaveLength(3000);
    expect(new Set(all).size).toBe(3000);
    expect(third).toEqual([]);
  });

  it('throws when the first page fails and fires the change on the next poll', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'pending' });
    vendor.failures = [503];
    tick(5);
    await expect(trigger.run(hookContext({ store }))).rejects.toThrow();
    expect(await poll({ store })).toEqual(['pending']);
  });

  it('continues from the lastPoll saved by the previous version on republish', async () => {
    const { store, data } = memoryStore();
    createEvent({ id: 'already-fired' });
    data.set('lastPoll', JSON.stringify(Date.parse(eventById({ id: 'already-fired' }).updated)));
    createEvent({ id: 'missed' });

    await trigger.onEnable(hookContext({ store, isRepublish: true }));

    expect(await poll({ store })).toEqual(['missed']);
    expect(await poll({ store })).toEqual([]);
  });

  it('starts from now on a plain re-enable and when Expand Recurring Events changes on republish', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'while-off' });
    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);

    createEvent({ id: 'before-switch' });
    await trigger.onEnable(hookContext({ store, isRepublish: true, expand: true }));
    expect(await poll({ store, expand: true })).toEqual([]);
    createEvent({ id: 'after-switch' });
    expect(await poll({ store, expand: true })).toEqual(['after-switch']);
  });

  it('asks Google for deleted items so the checkpoint sees every change, and expands occurrences only when asked', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await poll({ store });
    expect(vendor.requests[0]['showDeleted']).toBe('true');
    expect(vendor.requests[0]['singleEvents']).toBe('false');
    expect(vendor.requests[0]['orderBy']).toBe('updated');

    await trigger.onEnable(hookContext({ store, isRepublish: true, expand: true }));
    await poll({ store, expand: true });
    expect(vendor.requests[1]['singleEvents']).toBe('true');
  });

  it('test() returns the newest live events and never a cancelled one, with no earlier activity', async () => {
    createEvent({ id: 'older', at: clock - 3 * DAY });
    createEvent({ id: 'newer', at: clock - 2 * DAY });
    createEvent({ id: 'gone', at: clock - DAY, status: 'cancelled' });
    const { store } = memoryStore();

    const sample = await trigger.test(hookContext({ store }));

    expect(sample.map(idOf)).toEqual(['newer', 'older']);
  });
});

function tick(minutes: number): void {
  clock += minutes * MINUTE;
  vi.setSystemTime(clock);
}

function createEvent({ id, at, status }: { id: string; at?: number; status?: string }): void {
  tick(1);
  const time = new Date(at ?? clock).toISOString();
  vendor.events.set(id, {
    kind: 'calendar#event',
    id,
    status: status ?? 'confirmed',
    summary: `Event ${id}`,
    created: time,
    updated: time,
    start: { dateTime: new Date(clock + DAY).toISOString() },
    end: { dateTime: new Date(clock + DAY + 30 * MINUTE).toISOString() },
  });
}

function editEvent({ id }: { id: string }): void {
  tick(1);
  eventById({ id }).updated = new Date(clock).toISOString();
}

function deleteEvent({ id }: { id: string }): void {
  tick(1);
  const event = eventById({ id });
  event.status = 'cancelled';
  event.updated = new Date(clock).toISOString();
}

function editRange({ from, count }: { from: number; count: number }): void {
  tick(1);
  Array.from(vendor.events.values())
    .slice(from, from + count)
    .forEach((event, index) => {
      event.updated = new Date(clock + index).toISOString();
    });
  clock += count;
  vi.setSystemTime(clock);
}

function eventById({ id }: { id: string }): VendorEvent {
  const event = vendor.events.get(id);
  if (!event) {
    throw new Error(`no event ${id}`);
  }
  return event;
}

function checkpointOf({ data }: { data: Map<string, string> }): { scannedThroughMs: number } {
  const raw = data.get(CHECKPOINT_KEY);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'scannedThroughMs' in parsed && typeof parsed.scannedThroughMs === 'number') {
    return { scannedThroughMs: parsed.scannedThroughMs };
  }
  throw new Error('no checkpoint');
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  if (vendor.latencyMs > 0) {
    clock += vendor.latencyMs;
    vi.setSystemTime(clock);
  }
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  vendor.requests.push(params);
  const updatedMin = params['updatedMin'];
  const tooOld = vendor.goneAfterDays > 0 && updatedMin !== undefined && Date.parse(updatedMin) < clock - vendor.goneAfterDays * DAY;
  const failure = tooOld ? 410 : vendor.failures.shift();
  if (failure !== undefined && failure !== 0) {
    throw new HttpError(request.body, { status: failure, responseBody: { error: { code: failure } } });
  }
  return { status: 200, headers: {}, body: listEvents({ params }) };
}

function listEvents({ params }: { params: Record<string, string> }): { items: VendorEvent[]; nextPageToken?: string } {
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const visible = Array.from(vendor.events.values())
    .filter((event) => Date.parse(event.updated) >= updatedMin)
    .filter((event) => event.status !== 'cancelled' || params['showDeleted'] === 'true' || params['updatedMin'] !== undefined)
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  const pageSize = Math.min(Number(params['maxResults'] ?? '250'), 2500);
  const offset = Number(params['pageToken'] ?? '0');
  const page = visible.slice(offset, offset + pageSize).map((event) => ({ ...event }));
  return offset + pageSize < visible.length ? { items: page, nextPageToken: String(offset + pageSize) } : { items: page };
}

async function quickPoll({ store, seconds }: { store: Store; seconds: number }): Promise<string[]> {
  clock += seconds * 1000;
  vi.setSystemTime(clock);
  return (await trigger.run(hookContext({ store }))).map(idOf);
}

async function poll({ store, expand }: { store: Store; expand?: boolean }): Promise<string[]> {
  tick(5);
  return (await trigger.run(hookContext({ store, expand }))).map(idOf);
}

function idOf(item: unknown): string {
  return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
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

function hookContext({ store, isRepublish, expand }: { store: Store; isRepublish?: boolean; expand?: boolean }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, isRepublish, expand }]);
}

function fakeContext({ store, isRepublish, expand }: { store: Store; isRepublish?: boolean; expand?: boolean }) {
  return {
    store,
    isRepublish,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: 'primary', expandRecurringEvent: expand ?? false },
    files: {},
  };
}

type FakeVendorState = {
  events: Map<string, VendorEvent>;
  requests: Record<string, string>[];
  latencyMs: number;
  failures: number[];
  goneAfterDays: number;
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  start: { dateTime: string };
  end: { dateTime: string };
};
