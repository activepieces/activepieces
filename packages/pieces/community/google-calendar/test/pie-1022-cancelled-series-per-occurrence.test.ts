import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventCancelled } from '../src/lib/triggers/event-cancelled';

const MIN = 60_000;
const WEEK = 7 * 24 * 3600_000;
const T0 = Date.parse('2026-10-05T09:00:00Z');

const cal: { seriesDeletedAt: number | null; cancelledOccurrences: Map<number, number> } = {
  seriesDeletedAt: null,
  cancelledOccurrences: new Map<number, number>(),
};
const SERIES = { id: 'standup', summary: 'Weekly standup', created: iso({ ms: T0 - 30 * 24 * 3600_000 }), firstStart: T0 + 24 * 3600_000, count: 12 };

function iso({ ms }: { ms: number }): string {
  return new Date(ms).toISOString();
}

function instanceId({ index }: { index: number }): string {
  return `${SERIES.id}_${new Date(SERIES.firstStart + index * WEEK).toISOString().replace(/[-:]/g, '').replace('.000', '')}`;
}

function json({ body, status }: { body: unknown; status?: number }): Response {
  return new Response(JSON.stringify(body), { status: status ?? 200, headers: { 'content-type': 'application/json' } });
}

function occurrence({ index, updated }: { index: number; updated: number }): Record<string, unknown> {
  return {
    kind: 'calendar#event', id: instanceId({ index }), status: 'cancelled', summary: SERIES.summary, created: SERIES.created, updated: iso({ ms: updated }),
    recurringEventId: SERIES.id, originalStartTime: { dateTime: iso({ ms: SERIES.firstStart + index * WEEK }) }, organizer: { self: true },
  };
}

async function fakeGoogleCalendar(input: string | URL | Request): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (!/^\/calendar\/v3\/calendars\/[^/]+\/events$/.test(url.pathname)) return json({ body: { error: { code: 404 } }, status: 404 });
  const updatedMin = Date.parse(url.searchParams.get('updatedMin') ?? iso({ ms: 0 }));
  const singleEvents = url.searchParams.get('singleEvents') === 'true';
  const items: Record<string, unknown>[] = [];
  if (cal.seriesDeletedAt !== null && cal.seriesDeletedAt >= updatedMin) {
    if (singleEvents) {
      for (let index = 0; index < SERIES.count; index++) items.push(occurrence({ index, updated: cal.seriesDeletedAt }));
    }
    else {
      items.push({ kind: 'calendar#event', id: SERIES.id, status: 'cancelled', summary: SERIES.summary, created: SERIES.created, updated: iso({ ms: cal.seriesDeletedAt }), recurrence: [`RRULE:FREQ=WEEKLY;COUNT=${SERIES.count}`], organizer: { self: true } });
    }
  }
  for (const [index, at] of cal.cancelledOccurrences) {
    if (at >= updatedMin) items.push(occurrence({ index, updated: at }));
  }
  return json({ body: { kind: 'calendar#events', items } });
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => { data.set(key, value); return value; },
    delete: async (key: string) => { data.delete(key); },
  };
}

const auth = { access_token: 'token', data: {} };
const props = { calendar_id: 'primary', specific_event: false, cancellation_reason: [] };

async function enabledTrigger() {
  const store = memoryStore();
  const ctx = { auth, store, propsValue: props, files: {} };
  vi.setSystemTime(new Date(T0));
  await Reflect.apply(eventCancelled.onEnable, eventCancelled, [ctx]);
  return ctx;
}

async function runOnce({ ctx }: { ctx: unknown }): Promise<{ id: string; recurringEventId?: string }[]> {
  return Reflect.apply(eventCancelled.run, eventCancelled, [ctx]);
}

describe('PIE-1022 calendar-wide Event Cancelled and recurring meetings', () => {
  beforeEach(() => {
    cal.seriesDeletedAt = null;
    cal.cancelledOccurrences.clear();
    vi.stubGlobal('fetch', vi.fn(fakeGoogleCalendar));
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('control: cancelling one occurrence fires once', async () => {
    const ctx = await enabledTrigger();
    cal.cancelledOccurrences.set(3, T0 + 2 * MIN);
    vi.setSystemTime(new Date(T0 + 5 * MIN));
    const fired = (await runOnce({ ctx })).map((event) => event.id);
    expect(fired).toEqual([instanceId({ index: 3 })]);
  });

  it('deleting the whole recurring meeting fires once', async () => {
    const ctx = await enabledTrigger();
    cal.seriesDeletedAt = T0 + 2 * MIN;
    vi.setSystemTime(new Date(T0 + 5 * MIN));
    const fired = await runOnce({ ctx });
    expect(fired).toHaveLength(1);
    expect(fired[0].id === SERIES.id || fired[0].recurringEventId === SERIES.id).toBe(true);
  });
});
