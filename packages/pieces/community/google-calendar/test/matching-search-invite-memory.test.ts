import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEventMatchingSearch as trigger } from '../src/lib/triggers/new-event-matching-search';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const CHECKPOINT_KEY = 'matching_search_checkpoint';

const vendor: { events: Map<string, VendorEvent> } = { events: new Map<string, VendorEvent>() };

let clock = Date.parse('2026-11-01T10:00:00.000Z');

beforeEach(() => {
  vendor.events.clear();
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Matching Search invitation memory', () => {
  it('fires a matching occurrence invitation when the series invitation did not pass Search In', async () => {
    const { store } = memoryStore();
    const props = { searchTerm: 'board', searchFields: ['location'] };
    await trigger.onEnable(hookContext({ store, ...props }));

    invite({ id: 'series', summary: 'Board review', location: 'Room 1' });
    expect(await poll({ store, ...props })).toEqual([]);

    invite({ id: 'series_20261110', summary: 'Board review', location: 'Boardroom', recurringEventId: 'series' });
    expect(await poll({ store, ...props })).toEqual(['series_20261110']);
    expect(await poll({ store, ...props })).toEqual([]);
  });

  it('keeps firing matching occurrences after the non-matching series invitation is edited and listed again', async () => {
    const { store } = memoryStore();
    const props = { searchTerm: 'board', searchFields: ['location'] };
    await trigger.onEnable(hookContext({ store, ...props }));

    invite({ id: 'series', summary: 'Board review', location: 'Room 1' });
    expect(await poll({ store, ...props })).toEqual([]);

    tick(1);
    const master = vendor.events.get('series');
    if (!master) {
      throw new Error('no series');
    }
    master.summary = 'Board review (agenda attached)';
    master.updated = new Date(clock).toISOString();
    expect(await poll({ store, ...props })).toEqual([]);

    invite({ id: 'series_20261117', summary: 'Board review', location: 'Boardroom', recurringEventId: 'series' });
    expect(await poll({ store, ...props })).toEqual(['series_20261117']);
  });

  it('still suppresses occurrences of a series invitation that fired', async () => {
    const { store } = memoryStore();
    const props = { searchTerm: 'board', searchFields: ['location'] };
    await trigger.onEnable(hookContext({ store, ...props }));

    invite({ id: 'series', summary: 'Weekly', location: 'Boardroom' });
    expect(await poll({ store, ...props })).toEqual(['series']);

    invite({ id: 'series_20261110', summary: 'Weekly', location: 'Boardroom', recurringEventId: 'series' });
    expect(await poll({ store, ...props })).toEqual([]);
  });

  it('forgets a remembered invitation when Google returns it deleted with only its id', async () => {
    const { store, data } = memoryStore();
    const props = { searchTerm: 'board', searchFields: undefined };
    await trigger.onEnable(hookContext({ store, ...props }));
    invite({ id: 'gone', summary: 'Board sync', location: 'Room 2' });
    expect(await poll({ store, ...props })).toEqual(['gone']);
    expect(rememberedInvites({ data })).toContain('gone');

    tick(1);
    vendor.events.set('gone', { kind: 'calendar#event', id: 'gone', status: 'cancelled', updated: new Date(clock).toISOString() });
    expect(await poll({ store, ...props })).toEqual([]);
    expect(rememberedInvites({ data })).not.toContain('gone');
  });
});

function tick(minutes: number): void {
  clock += minutes * MINUTE;
  vi.setSystemTime(clock);
}

function invite({ id, summary, location, recurringEventId }: { id: string; summary: string; location: string; recurringEventId?: string }): void {
  tick(1);
  const now = new Date(clock).toISOString();
  vendor.events.set(id, {
    kind: 'calendar#event',
    id,
    status: 'confirmed',
    summary,
    location,
    created: now,
    updated: now,
    start: { dateTime: new Date(clock + DAY).toISOString() },
    organizer: { email: 'organizer@other.example.com', self: false },
    attendees: [
      { email: 'organizer@other.example.com', responseStatus: 'accepted' },
      { email: 'me@example.com', self: true, responseStatus: 'needsAction' },
    ],
    ...(recurringEventId ? { recurringEventId } : {}),
  });
}

function rememberedInvites({ data }: { data: Map<string, string> }): string[] {
  const raw = data.get(CHECKPOINT_KEY);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'invites' in parsed && Array.isArray(parsed.invites)) {
    const invites: unknown[] = parsed.invites;
    return invites.map((entry) => (typeof entry === 'object' && entry !== null && 'id' in entry ? String(entry.id) : ''));
  }
  throw new Error('no checkpoint');
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const term = (params['q'] ?? '').toLowerCase();
  const items = Array.from(vendor.events.values())
    .filter((event) => Date.parse(event.updated) >= updatedMin)
    .filter((event) => event.status === 'cancelled' || `${event.summary ?? ''} ${event.location ?? ''}`.toLowerCase().includes(term))
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  return { status: 200, headers: {}, body: { items } };
}

async function poll({ store, searchTerm, searchFields }: { store: Store; searchTerm: string; searchFields: string[] | undefined }): Promise<string[]> {
  tick(5);
  return (await trigger.run(hookContext({ store, searchTerm, searchFields }))).map(idOf);
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

function hookContext({ store, searchTerm, searchFields }: { store: Store; searchTerm: string; searchFields: string[] | undefined }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, searchTerm, searchFields }]);
}

function fakeContext({ store, searchTerm, searchFields }: { store: Store; searchTerm: string; searchFields: string[] | undefined }) {
  return {
    store,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: 'primary', search_term: searchTerm, event_types: undefined, search_fields: searchFields },
    files: {},
  };
}

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  updated: string;
  summary?: string;
  location?: string;
  created?: string;
  start?: { dateTime: string };
  organizer?: { email: string; self: boolean };
  attendees?: { email: string; self?: boolean; responseStatus: string }[];
  recurringEventId?: string;
};
