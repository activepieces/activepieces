import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent } from '../../../../pieces/community/google-calendar/src/lib/triggers/new-event';

type FakeEvent = {
  id: string;
  status: string;
  created: string;
  updated: string;
  summary: string;
  start: { dateTime: string };
  end: { dateTime: string };
  eventType: string;
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { dateTime: string };
};

const AUTH = { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} };
const CALENDAR_ID = 'team@example.com';

function createFakeCalendar() {
  let version = 0;
  const events = new Map<string, { event: FakeEvent; changedAt: number }>();
  const upsert = (event: FakeEvent) => {
    version += 1;
    events.set(event.id, { event, changedAt: version });
  };
  const respond = async (request: HttpRequest) => {
    const url = new URL(request.url);
    if (url.pathname.endsWith('/events/watch')) {
      const body: { id: string; expiration: string } = request.body;
      return { status: 200, headers: {}, body: { kind: 'api#channel', id: body.id, resourceId: 'res-1', expiration: body.expiration } };
    }
    if (url.pathname.endsWith('/channels/stop')) {
      return { status: 204, headers: {}, body: {} };
    }
    if (url.pathname.endsWith('/events') && request.method === 'GET') {
      const q = request.queryParams ?? {};
      if (q.syncToken) {
        const since = Number(q.syncToken.replace('tok-', ''));
        const items = [...events.values()].filter((e) => e.changedAt > since).map((e) => e.event);
        return { status: 200, headers: {}, body: { kind: 'calendar#events', items, nextSyncToken: `tok-${version}` } };
      }
      const items = [...events.values()].filter((e) => e.event.status !== 'cancelled').map((e) => e.event);
      return { status: 200, headers: {}, body: q.fields ? { nextSyncToken: `tok-${version}` } : { items, nextSyncToken: `tok-${version}` } };
    }
    throw new Error(`unexpected request ${request.method} ${request.url}`);
  };
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(respond, undefined, [request]));
  return { upsert, get: (id: string) => events.get(id)!.event };
}

function createStore() {
  const data = new Map<string, unknown>();
  return {
    put: async (key: string, value: unknown) => {
      data.set(key, JSON.parse(JSON.stringify(value)));
      return value;
    },
    get: async (key: string) => (data.has(key) ? data.get(key) : null),
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function iso(ms: number) {
  return new Date(ms).toISOString();
}

function meeting({ id, createdMs, summary = 'Customer call' }: { id: string; createdMs: number; summary?: string }): FakeEvent {
  return {
    id,
    status: 'confirmed',
    created: iso(createdMs),
    updated: iso(createdMs + 400),
    summary,
    start: { dateTime: '2026-10-20T10:00:00Z' },
    end: { dateTime: '2026-10-20T11:00:00Z' },
    eventType: 'default',
  };
}

function edit({ event, changes }: { event: FakeEvent; changes: Partial<FakeEvent> }): FakeEvent {
  return { ...event, ...changes, updated: iso(Date.now()) };
}

const props = { calendar_id: CALENDAR_ID, event_types: undefined, search_filter: undefined, exclude_all_day: false };

function baseContext(store: ReturnType<typeof createStore>) {
  return {
    auth: AUTH,
    propsValue: props,
    store,
    webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
  };
}

async function enable(store: ReturnType<typeof createStore>): Promise<void> {
  await Reflect.apply(newEvent.onEnable, newEvent, [baseContext(store)]);
}

async function pushNotification(store: ReturnType<typeof createStore>): Promise<string[]> {
  const watchId: string | undefined = Reflect.get(Object(await store.get('google_calendar_watch')), 'id');
  const fired: FakeEvent[] = await Reflect.apply(newEvent.run, newEvent, [{
    ...baseContext(store),
    payload: {
      method: 'POST',
      headers: { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': watchId ?? 'no-channel', 'x-goog-resource-id': 'res-1' },
      body: {},
      queryParams: {},
    },
  }]);
  return fired.map((e) => e.id);
}

const DAY = 24 * 60 * 60 * 1000;

describe('PIE-1039 Google Calendar New Event fires only for newly created events', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-10-02T09:00:00Z'));
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('control: a meeting created after enabling fires once, and its later edit does not fire again', async () => {
    const calendar = createFakeCalendar();
    const store = createStore();
    await enable(store);

    vi.setSystemTime(new Date('2026-10-02T09:05:00Z'));
    calendar.upsert(meeting({ id: 'brand-new-1', createdMs: Date.now() }));
    expect(await pushNotification(store)).toEqual(['brand-new-1']);

    vi.setSystemTime(new Date('2026-10-02T09:30:00Z'));
    calendar.upsert(edit({ event: calendar.get('brand-new-1'), changes: { summary: 'Customer call (moved)' } }));
    expect(await pushNotification(store)).toEqual([]);
  });

  it('rescheduling a meeting that already existed before the flow was enabled does not fire New Event', async () => {
    const calendar = createFakeCalendar();
    calendar.upsert(meeting({ id: 'existing-1', createdMs: Date.now() - 30 * DAY, summary: 'Quarterly review' }));
    const store = createStore();
    await enable(store);

    vi.setSystemTime(new Date('2026-10-02T10:00:00Z'));
    calendar.upsert(edit({ event: calendar.get('existing-1'), changes: { start: { dateTime: '2026-10-21T10:00:00Z' } } }));

    expect(await pushNotification(store)).toEqual([]);
  });

  it('editing a meeting that was already delivered does not fire again after 500 newer meetings were created', async () => {
    const calendar = createFakeCalendar();
    const store = createStore();
    await enable(store);

    vi.setSystemTime(new Date('2026-10-02T09:01:00Z'));
    calendar.upsert(meeting({ id: 'first-booking', createdMs: Date.now() }));
    expect(await pushNotification(store)).toEqual(['first-booking']);

    for (let i = 0; i < 500; i++) {
      vi.setSystemTime(new Date(Date.parse('2026-10-02T10:00:00Z') + i * 60_000));
      calendar.upsert(meeting({ id: `booking-${i}`, createdMs: Date.now() }));
    }
    expect((await pushNotification(store)).length).toBe(500);

    vi.setSystemTime(new Date('2026-10-03T12:00:00Z'));
    calendar.upsert(edit({ event: calendar.get('first-booking'), changes: { summary: 'Customer call - new agenda' } }));
    expect(await pushNotification(store)).toEqual([]);
  });

  it('moving one occurrence of a recurring meeting that existed before enabling does not fire New Event', async () => {
    const calendar = createFakeCalendar();
    const seriesCreated = Date.now() - 60 * DAY;
    calendar.upsert({
      ...meeting({ id: 'weekly1on1', createdMs: seriesCreated, summary: 'Weekly 1:1' }),
      recurrence: ['RRULE:FREQ=WEEKLY;BYDAY=MO'],
      start: { dateTime: '2026-08-03T09:00:00Z' },
      end: { dateTime: '2026-08-03T09:30:00Z' },
    });
    const store = createStore();
    await enable(store);

    vi.setSystemTime(new Date('2026-10-02T11:00:00Z'));
    calendar.upsert({
      ...meeting({ id: 'weekly1on1_20261005T090000Z', createdMs: seriesCreated, summary: 'Weekly 1:1' }),
      updated: iso(Date.now()),
      recurringEventId: 'weekly1on1',
      originalStartTime: { dateTime: '2026-10-05T09:00:00Z' },
      start: { dateTime: '2026-10-06T09:00:00Z' },
      end: { dateTime: '2026-10-06T09:30:00Z' },
    });

    expect(await pushNotification(store)).toEqual([]);
  });
});
