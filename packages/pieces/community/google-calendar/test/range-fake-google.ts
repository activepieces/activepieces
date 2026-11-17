import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { vi } from 'vitest';

dayjs.extend(utc);
dayjs.extend(timezone);

const EVENTS_PATH = /\/calendars\/([^/]+)\/events(?:\/([^/?]+))?$/;
const CALENDAR_PATH = /\/calendars\/([^/]+)$/;

export const fakeCalendar: FakeCalendarState = {
  timeZone: 'UTC',
  events: [],
  pageSize: 250,
  failNextLists: 0,
  failListPage: null,
  failNextGets: 0,
  listDelayMs: 0,
  rejectNextPageToken: false,
  requests: [],
};

export function resetFakeCalendar(): void {
  fakeCalendar.timeZone = 'UTC';
  fakeCalendar.events = [];
  fakeCalendar.pageSize = 250;
  fakeCalendar.failNextLists = 0;
  fakeCalendar.failListPage = null;
  fakeCalendar.failNextGets = 0;
  fakeCalendar.listDelayMs = 0;
  fakeCalendar.rejectNextPageToken = false;
  fakeCalendar.requests = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) =>
    Reflect.apply(answer, undefined, [request])
  );
}

export function addTimedEvent({
  id,
  start,
  end,
  created,
  status,
}: {
  id: string;
  start: string;
  end: string;
  created?: string;
  status?: string;
}): FakeEvent {
  const event: FakeEvent = {
    kind: 'calendar#event',
    id,
    status: status ?? 'confirmed',
    summary: id,
    created: created ?? '2026-09-01T00:00:00.000Z',
    updated: created ?? '2026-09-01T00:00:00.000Z',
    start: { dateTime: start },
    end: { dateTime: end },
  };
  fakeCalendar.events.push(event);
  return event;
}

export function addAllDayEvent({
  id,
  startDate,
  endDate,
}: {
  id: string;
  startDate: string;
  endDate: string;
}): FakeEvent {
  const event: FakeEvent = {
    kind: 'calendar#event',
    id,
    status: 'confirmed',
    summary: id,
    created: '2026-09-01T00:00:00.000Z',
    updated: '2026-09-01T00:00:00.000Z',
    start: { date: startDate },
    end: { date: endDate },
  };
  fakeCalendar.events.push(event);
  return event;
}

export function memoryStore(): { store: Store; data: Map<string, string> } {
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

export function setNow({ iso }: { iso: string }): void {
  vi.setSystemTime(new Date(iso));
}

export const fakeAuth = {
  type: AppConnectionType.OAUTH2,
  access_token: 'token-123',
  data: {},
};

export const idsOf = (events: unknown[]): string[] =>
  events.map((event) => String(Reflect.get(Object(event), 'id')));

export function triggerContext<T>({ value }: { value: Record<string, unknown> }): T {
  return Reflect.apply(identity, undefined, [value]);
}

export function googleTimeMs({ bound }: { bound: FakeBound }): number {
  return boundMs({ bound });
}

function identity(value: unknown): unknown {
  return value;
}

function boundMs({ bound }: { bound: FakeBound }): number {
  if (bound.dateTime) {
    return Date.parse(bound.dateTime);
  }
  return dayjs.tz(bound.date, fakeCalendar.timeZone).valueOf();
}

function fail({ status }: { status: number }): never {
  throw new HttpError({}, { status, responseBody: { error: { code: status } } });
}

async function answer(request: HttpRequest): Promise<unknown> {
  const url = request.url.split('?')[0];
  const query: Record<string, string> = { ...(request.queryParams ?? {}) };
  fakeCalendar.requests.push({ url, query });
  const eventsMatch = url.match(EVENTS_PATH);
  if (eventsMatch && eventsMatch[2]) {
    if (fakeCalendar.failNextGets > 0) {
      fakeCalendar.failNextGets -= 1;
      fail({ status: 503 });
    }
    const found = fakeCalendar.events.find(
      (event) => event.id === decodeURIComponent(eventsMatch[2])
    );
    if (!found) {
      fail({ status: 404 });
    }
    return { status: 200, headers: {}, body: found };
  }
  if (eventsMatch) {
    const offset = query['pageToken'] ? Number(query['pageToken']) : 0;
    if (fakeCalendar.listDelayMs > 0) {
      vi.setSystemTime(Date.now() + fakeCalendar.listDelayMs);
    }
    if (fakeCalendar.rejectNextPageToken && query['pageToken']) {
      fakeCalendar.rejectNextPageToken = false;
      fail({ status: 400 });
    }
    if (fakeCalendar.failNextLists > 0) {
      fakeCalendar.failNextLists -= 1;
      fail({ status: 503 });
    }
    if (fakeCalendar.failListPage !== null && offset > 0) {
      fakeCalendar.failListPage = null;
      fail({ status: 503 });
    }
    const timeMin = query['timeMin'] ? Date.parse(query['timeMin']) : null;
    const timeMax = query['timeMax'] ? Date.parse(query['timeMax']) : null;
    const listed = fakeCalendar.events
      .filter((event) => event.status !== 'cancelled' || query['showDeleted'] === 'true')
      .filter((event) => timeMin === null || boundMs({ bound: event.end }) > timeMin)
      .filter((event) => timeMax === null || boundMs({ bound: event.start }) < timeMax)
      .sort((left, right) => boundMs({ bound: left.start }) - boundMs({ bound: right.start }));
    const pageSize = Math.min(
      Number(query['maxResults'] ?? 250),
      fakeCalendar.pageSize
    );
    const page = listed.slice(offset, offset + pageSize);
    const next = offset + pageSize < listed.length ? String(offset + pageSize) : undefined;
    return {
      status: 200,
      headers: {},
      body: {
        kind: 'calendar#events',
        timeZone: fakeCalendar.timeZone,
        items: page,
        ...(next ? { nextPageToken: next } : {}),
      },
    };
  }
  if (url.match(CALENDAR_PATH)) {
    return { status: 200, headers: {}, body: { timeZone: fakeCalendar.timeZone } };
  }
  throw new Error(`unexpected request ${request.method} ${request.url}`);
}

type FakeBound = { dateTime?: string; date?: string };

export type FakeEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  start: FakeBound;
  end: FakeBound;
};

type FakeCalendarState = {
  timeZone: string;
  events: FakeEvent[];
  pageSize: number;
  failNextLists: number;
  failListPage: number | null;
  failNextGets: number;
  listDelayMs: number;
  rejectNextPageToken: boolean;
  requests: { url: string; query: Record<string, string> }[];
};
