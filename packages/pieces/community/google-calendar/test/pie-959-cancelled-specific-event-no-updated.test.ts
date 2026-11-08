import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventCancelled } from '../src/lib/triggers/event-cancelled';

const EVENT_ID = 'k9t2weekly_20261008T150000Z';
const google: { event: Record<string, unknown> } = { event: {} };

function json({ body, status }: { body: unknown; status?: number }): Response {
  return new Response(JSON.stringify(body), { status: status ?? 200, headers: { 'content-type': 'application/json' } });
}

async function fakeGoogleCalendar(input: string | URL | Request): Promise<Response> {
  const url = new URL(input instanceof Request ? input.url : input.toString());
  if (url.pathname !== `/calendar/v3/calendars/primary/events/${EVENT_ID}`) return json({ body: { error: { code: 404 } }, status: 404 });
  return json({ body: google.event });
}

function memoryStore() {
  const data = new Map<string, unknown>();
  return {
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    put: async (key: string, value: unknown) => { data.set(key, value); return value; },
    delete: async (key: string) => { data.delete(key); },
  };
}

const auth = { type: 'OAUTH2', access_token: 'token', data: {} };

const confirmed = {
  kind: 'calendar#event',
  etag: '"1"',
  id: EVENT_ID,
  status: 'confirmed',
  summary: 'Weekly client sync',
  updated: '2026-10-01T09:00:00.000Z',
  recurringEventId: 'k9t2weekly',
  originalStartTime: { dateTime: '2026-10-08T15:00:00Z' },
  start: { dateTime: '2026-10-08T15:00:00Z' },
  end: { dateTime: '2026-10-08T15:30:00Z' },
};

async function pollsAroundCancellation({ cancelledResponse }: { cancelledResponse: Record<string, unknown> }): Promise<string[][]> {
  const store = memoryStore();
  const props = { calendar_id: 'primary', specific_event: true, event_id: EVENT_ID, cancellation_reason: [] };
  const ctx = { auth, store, propsValue: props, files: {} };
  google.event = confirmed;
  vi.setSystemTime(new Date('2026-10-05T10:00:00Z'));
  await Reflect.apply(eventCancelled.onEnable, eventCancelled, [ctx]);
  const polls: string[][] = [];
  for (const at of ['10:05', '10:10', '10:15']) {
    if (at === '10:10') google.event = cancelledResponse;
    vi.setSystemTime(new Date(`2026-10-05T${at}:00Z`));
    const out: { id: string }[] = await Reflect.apply(eventCancelled.run, eventCancelled, [ctx]);
    polls.push(out.map((event) => event.id));
  }
  return polls;
}

describe('PIE-959 Event Cancelled - Target Specific Event', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn(fakeGoogleCalendar));
    vi.useFakeTimers({ toFake: ['Date'] });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fires once when the watched occurrence is cancelled and Google returns only the guaranteed fields', async () => {
    const polls = await pollsAroundCancellation({
      cancelledResponse: {
        kind: 'calendar#event',
        etag: '"2"',
        id: EVENT_ID,
        status: 'cancelled',
        recurringEventId: 'k9t2weekly',
        originalStartTime: { dateTime: '2026-10-08T15:00:00Z' },
      },
    });
    expect(polls).toEqual([[], [EVENT_ID], []]);
  });

  it('control: fires once when the same cancellation also carries updated', async () => {
    const polls = await pollsAroundCancellation({
      cancelledResponse: {
        kind: 'calendar#event',
        etag: '"2"',
        id: EVENT_ID,
        status: 'cancelled',
        updated: '2026-10-05T10:07:00.000Z',
        recurringEventId: 'k9t2weekly',
        originalStartTime: { dateTime: '2026-10-08T15:00:00Z' },
      },
    });
    expect(polls).toEqual([[], [EVENT_ID], []]);
  });
});
