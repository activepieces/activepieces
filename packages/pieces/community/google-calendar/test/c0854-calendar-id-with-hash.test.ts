/// <reference types="vitest/globals" />
/**
 * C0854: Google Calendar "New or Updated Event" must work for every calendar its own Calendar
 * dropdown offers, including Google's holiday and birthday calendars, whose ids contain '#'
 * (e.g. en.usa#holiday@group.v.calendar.google.com).
 *
 * Real code: the registered trigger calendarEventChanged (src/index.ts:102) - its calendar_id
 * dropdown options(), onEnable and run - with the real pieces-common httpClient
 * (FetchHttpClient -> BaseHttpClient.getUrl). vitest.config aliases pieces-common to source.
 *
 * Stand-in: global fetch plays www.googleapis.com. Calendar ids are opaque path segments.
 * The fake decodes the segment after /calendars/ and answers only when it names a real
 * calendar; any other path gets Google's 404 body. calendarList.list returns the user's
 * calendars, holiday calendar included (accessRole reader).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const PRIMARY = 'owner@example.com';
const calendars = [
  { id: PRIMARY, summary: 'owner@example.com', accessRole: 'owner', primary: true },
  { id: 'en.usa#holiday@group.v.calendar.google.com', summary: 'Holidays in United States', accessRole: 'reader' },
  { id: 'addressbook#contacts@group.v.calendar.google.com', summary: 'Birthdays', accessRole: 'reader' },
];

const requested: string[] = [];
let updatedEvents: Record<string, { id: string; summary: string; updated: string }[]> = {};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

async function fakeGoogle(input: string | URL): Promise<Response> {
  const url = new URL(String(input));
  requested.push(`${url.pathname}`);
  if (url.pathname === '/calendar/v3/users/me/calendarList') {
    return json(200, { items: calendars });
  }
  const m = /^\/calendar\/v3\/calendars\/([^/]+)\/events$/.exec(url.pathname);
  if (m) {
    const id = decodeURIComponent(m[1]);
    if (calendars.some((c) => c.id === id)) {
      return json(200, { items: updatedEvents[id] ?? [] });
    }
  }
  return json(404, { error: { code: 404, message: 'Not Found', errors: [{ reason: 'notFound' }] } });
}

import { calendarEventChanged } from '../src/lib/triggers/calendar-event';

function flowStore() {
  const data = new Map<string, unknown>();
  return {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.has(key) ? data.get(key) : null) as T | null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
}

const auth = { type: 'OAUTH2', access_token: 'test-token', data: {} };

describe('Google Calendar New or Updated Event on a calendar whose id contains #', () => {
  beforeEach(() => {
    requested.length = 0;
    updatedEvents = {};
    vi.stubGlobal('fetch', vi.fn(fakeGoogle));
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each(['Holidays in United States', 'Birthdays'])(
    'starts a run when an event in "%s" (picked from the Calendar dropdown) is updated',
    async (calendarName) => {
      // The user opens the Calendar dropdown and picks the calendar by name.
      const dropdown = (await (calendarEventChanged.props.calendar_id as any).options(
        { auth },
        {}
      )) as { options: { label: string; value: string }[] };
      const picked = dropdown.options.find((o) => o.label === calendarName);
      expect(picked, 'calendar offered by the dropdown').toBeDefined();
      const calendarId = picked!.value;

      const store = flowStore();
      const ctx = {
        auth,
        store,
        propsValue: { calendar_id: calendarId, expandRecurringEvent: false },
        files: { write: async () => 'https://files.example/f' },
      } as never;
      await calendarEventChanged.onEnable(ctx);

      // Google updates an event in that calendar after the flow was published.
      updatedEvents[calendarId] = [
        {
          id: 'evt-1',
          summary: 'Updated event',
          updated: new Date(Date.now() + 60_000).toISOString(),
        },
      ];

      let outcome: unknown;
      try {
        const out = (await calendarEventChanged.run(ctx)) as { summary: string }[];
        outcome = out.map((e) => e.summary);
      } catch (e) {
        outcome = `poll failed (${String((e as Error).message ?? e).slice(0, 80)}) requesting ${requested.at(-1)}`;
      }
      expect(outcome, 'events that started a run').toEqual(['Updated event']);
    }
  );
});
