import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventCancelled } from '../src/lib/triggers/event-cancelled';

type CalEvent = Record<string, unknown> & { id: string; status: string; updated: string };

const google: { events: CalEvent[] } = { events: [] };

function json({ body, status }: { body: unknown; status?: number }): Response {
  return new Response(JSON.stringify(body), { status: status ?? 200, headers: { 'content-type': 'application/json' } });
}

async function fakeGoogleCalendar(input: string | URL | Request): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (!/^\/calendar\/v3\/calendars\/[^/]+\/events$/.test(url.pathname)) return json({ body: { error: { code: 404 } }, status: 404 });
  const updatedMin = url.searchParams.get('updatedMin');
  const items = google.events
    .filter((event) => event.status !== 'cancelled' || url.searchParams.get('showDeleted') === 'true')
    .filter((event) => (updatedMin ? Date.parse(event.updated) >= Date.parse(updatedMin) : true))
    .sort((left, right) => Date.parse(left.updated) - Date.parse(right.updated));
  return json({ body: { kind: 'calendar#events', timeZone: 'UTC', items } });
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

async function cancellationsSeen({ reasons, cancelled }: { reasons: string[]; cancelled: CalEvent[] }): Promise<string[]> {
  const store = memoryStore();
  const props = { calendar_id: 'primary', specific_event: false, cancellation_reason: reasons };
  const ctx = { auth, store, propsValue: props, files: {} };
  vi.setSystemTime(new Date('2026-10-01T10:00:00Z'));
  await Reflect.apply(eventCancelled.onEnable, eventCancelled, [ctx]);
  google.events.push(...cancelled);
  vi.setSystemTime(new Date('2026-10-01T10:05:00Z'));
  const out: CalEvent[] = await Reflect.apply(eventCancelled.run, eventCancelled, [ctx]);
  return out.map((event) => event.id);
}

describe('PIE-973 Event Cancelled - Cancellation Reasons', () => {
  beforeEach(() => {
    google.events = [];
    vi.stubGlobal('fetch', vi.fn(fakeGoogleCalendar));
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('"Event Deleted" fires when the organizer deletes their own meeting (title kept)', async () => {
    const seen = await cancellationsSeen({
      reasons: ['deleted'],
      cancelled: [{
        id: 'q3', status: 'cancelled', updated: '2026-10-01T10:02:00.000Z',
        summary: 'Q3 Planning Session', organizer: { email: 'me@example.com', self: true }, creator: { email: 'me@example.com', self: true },
        start: { dateTime: '2026-10-05T10:00:00Z' }, end: { dateTime: '2026-10-05T11:00:00Z' },
        attendees: [{ email: 'me@example.com', self: true, organizer: true, responseStatus: 'accepted' }, { email: 'ann@example.com', responseStatus: 'accepted' }],
      }],
    });
    expect(seen).toEqual(['q3']);
  });

  it('"Other Cancellations" alone does not fire for cancellations the trigger itself files under another reason', async () => {
    const seen = await cancellationsSeen({
      reasons: ['other'],
      cancelled: [
        { id: 'gone', status: 'cancelled', updated: '2026-10-01T10:02:00.000Z' },
        {
          id: 'moved', status: 'cancelled', updated: '2026-10-01T10:03:00.000Z', summary: 'Dentist',
          description: 'Rescheduled to next week', start: { dateTime: '2026-10-06T09:00:00Z' }, end: { dateTime: '2026-10-06T09:30:00Z' },
        },
      ],
    });
    expect(seen).toEqual([]);
  });
});
