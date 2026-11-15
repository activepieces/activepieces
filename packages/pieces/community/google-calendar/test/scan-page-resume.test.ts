import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { calendarEventChanged } from '../src/lib/triggers/calendar-event';
import { eventCancelled } from '../src/lib/triggers/event-cancelled';
import { newEventMatchingSearch } from '../src/lib/triggers/new-event-matching-search';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const BULK = 6000;
const STORE_VALUE_MAX_SIZE = 512 * 1024;

const vendor: FakeVendorState = {
  events: [],
  latencyMs: 0,
  rejectToken: undefined,
  requests: [],
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

beforeEach(() => {
  vendor.events = [];
  vendor.latencyMs = 0;
  vendor.rejectToken = undefined;
  vendor.requests = [];
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  vi.spyOn(console, 'info').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Shared scan resumes from the saved page when one timestamp holds more events than one check can read', () => {
  it('New or Updated Event fires every one of 6000 changes with the same updated time exactly once', async () => {
    const { store } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    bulkChange({ status: 'confirmed' });

    const fired = await pollUntilQuiet({ run: () => calendarEventChanged.run(changedContext({ store })) });

    expect(fired.polls[0]).toBe(5000);
    expect(fired.ids).toHaveLength(BULK);
    expect(new Set(fired.ids).size).toBe(BULK);
  });

  it('Event Cancelled fires every one of 6000 cancellations with the same updated time exactly once', async () => {
    const { store } = memoryStore();
    await eventCancelled.onEnable(cancelledContext({ store }));
    bulkChange({ status: 'cancelled' });

    const fired = await pollUntilQuiet({ run: () => eventCancelled.run(cancelledContext({ store })) });

    expect(fired.polls[0]).toBe(5000);
    expect(fired.ids).toHaveLength(BULK);
    expect(new Set(fired.ids).size).toBe(BULK);
  });

  it('Matching Search reaches a new matching event listed after 6000 edits with the same updated time and fires it once', async () => {
    const { store } = memoryStore();
    for (let index = 0; index < BULK; index++) {
      addEvent({ id: googleId({ index }), summary: 'Interview archive', created: clock - 30 * DAY, updated: clock - 30 * DAY });
    }
    await newEventMatchingSearch.onEnable(searchContext({ store }));
    tick(1);
    const shared = clock;
    vendor.events.forEach((event) => {
      event.updated = new Date(shared).toISOString();
    });
    addEvent({ id: 'fresh', summary: 'Interview with Jane', created: shared, updated: shared });

    const fired = await pollUntilQuiet({ run: () => newEventMatchingSearch.run(searchContext({ store })) });

    expect(fired.ids).toEqual(['fresh']);
  });

  it('lists again from the saved time when Google rejects the saved page position, without firing anything twice', async () => {
    const { store } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    bulkChange({ status: 'confirmed', spreadMs: 1 });
    vendor.latencyMs = 8_000;
    tick(5);
    const first = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);
    expect(first).toHaveLength(5000);

    vendor.latencyMs = 0;
    vendor.rejectToken = '5000';
    tick(5);
    const second = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);
    expect(second).toHaveLength(1000);
    expect(new Set([...first, ...second]).size).toBe(BULK);
    expect(vendor.rejectToken).toBeUndefined();
    tick(5);
    expect(await calendarEventChanged.run(changedContext({ store }))).toEqual([]);
  });

  it('loses nothing when Google rejects the saved page position in the middle of one timestamp', async () => {
    const { store } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    bulkChange({ status: 'confirmed' });
    vendor.latencyMs = 8_000;
    tick(5);
    const first = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);
    vendor.latencyMs = 0;
    vendor.rejectToken = '5000';
    tick(5);
    const second = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);

    expect(new Set([...first, ...second]).size).toBe(BULK);
    tick(5);
    expect(await calendarEventChanged.run(changedContext({ store }))).toEqual([]);
  });

  it.each([
    { name: 'New or Updated Event', status: 'confirmed' },
    { name: 'Event Cancelled', status: 'cancelled' },
  ])('$name fires 6000 changes made in the same millisecond just before a check once each and keeps its state under the store limit', async ({ status }) => {
    const { store } = memoryStore();
    const run = status === 'cancelled'
      ? () => eventCancelled.run(cancelledContext({ store }))
      : () => calendarEventChanged.run(changedContext({ store }));
    if (status === 'cancelled') {
      await eventCancelled.onEnable(cancelledContext({ store }));
    }
    else {
      await calendarEventChanged.onEnable(changedContext({ store }));
    }
    bulkChange({ status, settleMs: 10_000 });

    const firstQuick = (await run()).map(idOf);
    clock += 20_000;
    vi.setSystemTime(clock);
    const secondQuick = (await run()).map(idOf);
    const later = await pollUntilQuiet({ run });

    expect(firstQuick).toHaveLength(BULK);
    expect(new Set(firstQuick).size).toBe(BULK);
    expect(secondQuick).toEqual([]);
    expect(later.ids).toEqual([]);
  });

  it.each([
    { name: 'New or Updated Event', status: 'confirmed' },
    { name: 'Event Cancelled', status: 'cancelled' },
  ])('$name fires 6000 same-millisecond changes once each when a budget cut lands inside that millisecond', async ({ status }) => {
    const { store } = memoryStore();
    const run = status === 'cancelled'
      ? () => eventCancelled.run(cancelledContext({ store }))
      : () => calendarEventChanged.run(changedContext({ store }));
    if (status === 'cancelled') {
      await eventCancelled.onEnable(cancelledContext({ store }));
    }
    else {
      await calendarEventChanged.onEnable(changedContext({ store }));
    }
    bulkChange({ status, settleMs: 10_000 });
    vendor.latencyMs = 8_000;

    const first = (await run()).map(idOf);
    const second = (await run()).map(idOf);
    const third = (await run()).map(idOf);

    expect(first).toHaveLength(5000);
    expect(second).toHaveLength(1000);
    expect(new Set([...first, ...second]).size).toBe(BULK);
    expect(third).toEqual([]);
  });

  it('Matching Search fires 6000 new matching events created in the same millisecond once each and keeps its state under the store limit', async () => {
    const { store } = memoryStore();
    await newEventMatchingSearch.onEnable(searchContext({ store }));
    tick(1);
    const shared = clock;
    for (let index = 0; index < BULK; index++) {
      addEvent({ id: googleId({ index }), summary: 'Interview slot', created: shared, updated: shared });
    }
    clock += 10_000;
    vi.setSystemTime(clock);

    const first = (await newEventMatchingSearch.run(searchContext({ store }))).map(idOf);
    clock += 20_000;
    vi.setSystemTime(clock);
    const second = (await newEventMatchingSearch.run(searchContext({ store }))).map(idOf);
    const later = await pollUntilQuiet({ run: () => newEventMatchingSearch.run(searchContext({ store })) });

    expect(new Set(first).size).toBe(BULK);
    expect(first).toHaveLength(BULK);
    expect(second).toEqual([]);
    expect(later.ids).toEqual([]);
  });

  it('sends the original updatedMin with the saved page token', async () => {
    const { store } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    bulkChange({ status: 'confirmed' });
    await pollUntilQuiet({ run: () => calendarEventChanged.run(changedContext({ store })) });

    const resumed = vendor.requests.find((params) => params['pageToken'] === '5000');
    expect(resumed?.['updatedMin']).toBe(vendor.requests[0]['updatedMin']);
  });

  it('keeps working from a checkpoint saved by the previous build without a page position', async () => {
    const { store, data } = memoryStore();
    data.set('new_or_updated_checkpoint', JSON.stringify({ watchKey: JSON.stringify(['primary', false]), scannedThroughMs: clock, createdFloorMs: clock, seen: [] }));
    tick(1);
    addEvent({ id: 'after-upgrade', summary: 'Sync', created: clock, updated: clock });
    tick(5);
    expect((await calendarEventChanged.run(changedContext({ store }))).map(idOf)).toEqual(['after-upgrade']);
  });
});

function bulkChange({ status, spreadMs, settleMs }: { status: string; spreadMs?: number; settleMs?: number }): void {
  for (let index = 0; index < BULK; index++) {
    addEvent({ id: googleId({ index }), summary: 'Imported', created: clock - 30 * DAY, updated: clock - 30 * DAY });
  }
  tick(1);
  const changedAt = clock;
  vendor.events.forEach((event, index) => {
    event.updated = new Date(changedAt + index * (spreadMs ?? 0)).toISOString();
    event.status = status;
  });
  clock += BULK * (spreadMs ?? 0) + (settleMs ?? 0);
  vi.setSystemTime(clock);
}

function googleId({ index }: { index: number }): string {
  return `${index.toString(32).padStart(4, '0')}k3v9q2m7r1t5u8a0b4c6d2e8`;
}

async function pollUntilQuiet({ run }: { run: () => Promise<unknown[]> }): Promise<{ ids: string[]; polls: number[] }> {
  vendor.latencyMs = 8_000;
  const ids: string[] = [];
  const polls: number[] = [];
  for (let round = 0; round < 6; round++) {
    tick(5);
    const fired = (await run()).map(idOf);
    ids.push(...fired);
    polls.push(fired.length);
  }
  return { ids, polls };
}

function tick(minutes: number): void {
  clock += minutes * MINUTE;
  vi.setSystemTime(clock);
}

function addEvent({ id, summary, created, updated }: { id: string; summary: string; created: number; updated: number }): void {
  vendor.events.push({
    kind: 'calendar#event',
    id,
    status: 'confirmed',
    summary,
    created: new Date(created).toISOString(),
    updated: new Date(updated).toISOString(),
    organizer: { email: 'me@example.com', self: true },
  });
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  clock += vendor.latencyMs;
  vi.setSystemTime(clock);
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  vendor.requests.push(params);
  if (vendor.rejectToken !== undefined && params['pageToken'] === vendor.rejectToken) {
    vendor.rejectToken = undefined;
    throw new HttpError(request.body, { status: 400, responseBody: { error: { code: 400, message: 'Invalid pageToken' } } });
  }
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const term = (params['q'] ?? '').toLowerCase();
  const visible = vendor.events
    .filter((event) => Date.parse(event.updated) >= updatedMin)
    .filter((event) => term === '' || event.summary.toLowerCase().includes(term))
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  const pageSize = Math.min(Number(params['maxResults'] ?? '250'), 2500);
  const offset = Number(params['pageToken'] ?? '0');
  const page = visible.slice(offset, offset + pageSize).map((event) => ({ ...event }));
  const body = offset + pageSize < visible.length ? { items: page, nextPageToken: String(offset + pageSize) } : { items: page };
  return { status: 200, headers: {}, body };
}

function idOf(item: unknown): string {
  return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
}

function memoryStore(): { store: Store; data: Map<string, string> } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      const serialized = JSON.stringify(value);
      if (Buffer.byteLength(serialized, 'utf8') > STORE_VALUE_MAX_SIZE) {
        throw new Error(`StorageLimitError: ${key} is larger than ${STORE_VALUE_MAX_SIZE} bytes`);
      }
      data.set(key, serialized);
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

function changedContext({ store }: { store: Store }): Parameters<typeof calendarEventChanged.run>[0] {
  return Reflect.apply(baseContext, undefined, [{ store, propsValue: { calendar_id: 'primary', expandRecurringEvent: false } }]);
}

function cancelledContext({ store }: { store: Store }): Parameters<typeof eventCancelled.run>[0] {
  return Reflect.apply(baseContext, undefined, [{ store, propsValue: { calendar_id: 'primary', specific_event: false, event_id: undefined, cancellation_reason: [] } }]);
}

function searchContext({ store }: { store: Store }): Parameters<typeof newEventMatchingSearch.run>[0] {
  return Reflect.apply(baseContext, undefined, [{ store, propsValue: { calendar_id: 'primary', search_term: 'interview', event_types: undefined, search_fields: undefined } }]);
}

function baseContext({ store, propsValue }: { store: Store; propsValue: Record<string, unknown> }) {
  return {
    store,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue,
    files: {},
  };
}

type FakeVendorState = {
  events: VendorEvent[];
  latencyMs: number;
  rejectToken: string | undefined;
  requests: Record<string, string>[];
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  organizer: { email: string; self: boolean };
};

describe('Shared scan keeps a split timestamp group and long ids inside the store limit', () => {
  it('does not fire a timestamp group again when the listing budget split it inside the visibility margin', async () => {
    const { store } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    tick(1);
    const changedAt = clock;
    for (let index = 0; index < 5300; index++) {
      addEvent({ id: googleId({ index }), summary: 'Imported', created: changedAt - 30 * DAY, updated: changedAt });
    }
    clock += 5_000;
    vi.setSystemTime(clock);
    vendor.latencyMs = 8_000;
    const ids: string[] = [];
    for (let round = 0; round < 4; round++) {
      ids.push(...(await calendarEventChanged.run(changedContext({ store }))).map(idOf));
      clock += 5_000;
      vi.setSystemTime(clock);
    }
    expect(ids).toHaveLength(5300);
    expect(new Set(ids).size).toBe(5300);
  });

  it('keeps the saved changes under the store limit when event ids are 1000 characters long', async () => {
    const { store, data } = memoryStore();
    await calendarEventChanged.onEnable(changedContext({ store }));
    tick(1);
    const changedAt = clock;
    for (let index = 0; index < 520; index++) {
      addEvent({ id: longId({ index }), summary: 'Imported', created: changedAt - 30 * DAY, updated: changedAt + index });
    }
    clock += 5_000;
    vi.setSystemTime(clock);
    const first = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);
    clock += 20_000;
    vi.setSystemTime(clock);
    const second = (await calendarEventChanged.run(changedContext({ store }))).map(idOf);
    expect(new Set(first).size).toBe(520);
    expect(second).toEqual([]);
    expect(Buffer.byteLength(data.get('new_or_updated_checkpoint') ?? '', 'utf8')).toBeLessThanOrEqual(STORE_VALUE_MAX_SIZE);
  });
});

function longId({ index }: { index: number }): string {
  return `${index.toString(32).padStart(4, '0')}${'k3v9q2m7r1t5u8a0'.repeat(63)}`.slice(0, 1000);
}
