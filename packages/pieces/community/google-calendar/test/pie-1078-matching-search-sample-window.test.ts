import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEventMatchingSearch as trigger } from '../src/lib/triggers/new-event-matching-search';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-11-01T10:00:00.000Z');

const vendor: { events: VendorEvent[] } = { events: [] };

beforeEach(() => {
  vendor.events = [];
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(NOW);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('PIE-1078 Matching Search test() sample window', () => {
  it('returns a matching event created three days ago when nothing matched in the last day', async () => {
    addEvent({ id: 'three-days', summary: 'Interview with Kim', ageMs: 3 * DAY });
    addEvent({ id: 'unrelated', summary: 'Lunch', ageMs: DAY / 2 });

    const sample = await trigger.test(hookContext({ store: memoryStore() }));

    expect(sample.map(idOf)).toEqual(['three-days']);
  });

  it('returns the newest matching events first', async () => {
    addEvent({ id: 'six-days', summary: 'Interview A', ageMs: 6 * DAY });
    addEvent({ id: 'two-days', summary: 'Interview B', ageMs: 2 * DAY });
    addEvent({ id: 'gone', summary: 'Interview C', ageMs: DAY, status: 'cancelled' });

    const sample = await trigger.test(hookContext({ store: memoryStore() }));

    expect(sample.map(idOf)).toEqual(['two-days', 'six-days']);
  });
});

function addEvent({ id, summary, ageMs, status }: { id: string; summary: string; ageMs: number; status?: string }): void {
  const time = new Date(NOW - ageMs).toISOString();
  vendor.events.push({
    kind: 'calendar#event',
    id,
    status: status ?? 'confirmed',
    summary,
    created: time,
    updated: time,
    organizer: { email: 'me@example.com', self: true },
  });
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const term = (params['q'] ?? '').toLowerCase();
  const items = vendor.events
    .filter((event) => Date.parse(event.updated) >= updatedMin)
    .filter((event) => event.summary.toLowerCase().includes(term))
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  return { status: 200, headers: {}, body: { items } };
}

function idOf(item: unknown): string {
  return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
}

function memoryStore(): Store {
  const data = new Map<string, string>();
  return {
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
}

function hookContext({ store }: { store: Store }): Parameters<typeof trigger.test>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store }]);
}

function fakeContext({ store }: { store: Store }) {
  return {
    store,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: 'primary', search_term: 'interview', event_types: undefined, search_fields: undefined },
    files: {},
  };
}

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  organizer: { email: string; self: boolean };
};
