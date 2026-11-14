import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newCalendar as trigger } from '../src/lib/triggers/new-calendar';
import { fakeAuth, idsOf, memoryStore, triggerContext } from './range-fake-google';

const CALENDAR_LIST = 'https://www.googleapis.com/calendar/v3/users/me/calendarList';
const GOOGLE_MAX_PAGE = 100;

const google: { calendars: FakeCalendar[]; pageRequests: number } = {
  calendars: [],
  pageRequests: 0,
};

beforeEach(() => {
  google.calendars = [{ kind: 'calendar#calendarListEntry', id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true }];
  google.pageRequests = 0;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) =>
    Reflect.apply(answer, undefined, [request])
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Calendar behaviour', () => {
  it('fires once for a calendar that appears on the second page of 150 calendars', async () => {
    addRooms({ count: 149 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    google.calendars.push(calendar({ id: 'board@group.calendar.google.com', accessRole: 'reader' }));
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['board@group.calendar.google.com']);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    expect(google.pageRequests).toBeGreaterThan(4);
  });

  it('does not fire a calendar that is hidden and shown again (PIE-1137)', async () => {
    google.calendars.push(calendar({ id: 'holidays', accessRole: 'reader' }));
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const holidays = google.calendars.find((entry) => entry.id === 'holidays');
    if (holidays) holidays.hidden = true;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    if (holidays) holidays.hidden = false;
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('learns calendars that were already hidden before the upgrade without firing them', async () => {
    google.calendars.push(calendar({ id: 'old-hidden', accessRole: 'reader' }));
    google.calendars[google.calendars.length - 1].hidden = true;
    const { store } = memoryStore();
    await store.put('calendars', ['me@example.com']);
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    google.calendars.push(calendar({ id: 'brand-new', accessRole: 'reader' }));
    google.calendars[google.calendars.length - 1].hidden = true;
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['brand-new']);
  });

  it('test() returns the same shape as a run, newest listed first, filters applied', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    google.calendars.push(calendar({ id: 'marketing', accessRole: 'writer' }));
    google.calendars.push(calendar({ id: 'holidays', accessRole: 'reader' }));
    const [payload] = await trigger.run(hookContext({ store, propsValue: { access_role_filter: ['writer'] } }));
    const sample = await trigger.test(hookContext({ store: memoryStore().store, propsValue: { access_role_filter: ['writer'] } }));
    expect(idsOf(sample)).toEqual(['marketing']);
    expect(Object.keys(Object(sample[0])).sort()).toEqual(Object.keys(Object(payload)).sort());
    expect(sample[0]).toEqual(payload);
  });

  it('test() returns up to five calendars, the last listed first', async () => {
    addRooms({ count: 8 });
    const sample = await trigger.test(hookContext({ store: memoryStore().store }));
    expect(idsOf(sample)).toEqual(['room-8', 'room-7', 'room-6', 'room-5', 'room-4']);
  });

  it('does not fire for existing calendars when a republish widens the filters', async () => {
    google.calendars.push(calendar({ id: 'team', accessRole: 'reader' }));
    google.calendars.push(calendar({ id: 'holidays', accessRole: 'reader' }));
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, propsValue: { access_role_filter: ['owner'] } }));
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true, propsValue: { access_role_filter: [] } }));
    expect(await trigger.run(hookContext({ store, propsValue: { access_role_filter: [] } }))).toEqual([]);
    google.calendars.push(calendar({ id: 'new-share', accessRole: 'reader' }));
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: { access_role_filter: [] } })))).toEqual(['new-share']);
  });

  it('after an upgrade, fires only calendars missing from the previous version list', async () => {
    google.calendars.push(calendar({ id: 'team', accessRole: 'reader' }));
    google.calendars.push(calendar({ id: 'added-during-upgrade', accessRole: 'owner' }));
    const { store } = memoryStore();
    await store.put('calendars', ['me@example.com']);
    await trigger.onEnable(hookContext({ store, isRepublish: true, propsValue: { access_role_filter: ['owner'] } }));
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: { access_role_filter: ['owner'] } })))).toEqual(['added-during-upgrade']);
  });
});

function addRooms({ count }: { count: number }): void {
  for (let index = 1; index <= count; index++) {
    google.calendars.push(calendar({ id: `room-${index}`, accessRole: 'writer' }));
  }
}

function calendar({ id, accessRole }: { id: string; accessRole: string }): FakeCalendar {
  return { kind: 'calendar#calendarListEntry', id, summary: id, accessRole };
}

async function answer(request: HttpRequest): Promise<unknown> {
  if (request.url !== CALENDAR_LIST) {
    throw new Error(`unexpected request ${request.method} ${request.url}`);
  }
  google.pageRequests += 1;
  const query: Record<string, string> = { ...(request.queryParams ?? {}) };
  const pageSize = Math.min(Number(query['maxResults'] ?? 100), GOOGLE_MAX_PAGE);
  const offset = query['pageToken'] ? Number(query['pageToken']) : 0;
  const visible = query['showHidden'] === 'true' ? google.calendars : google.calendars.filter((entry) => entry.hidden !== true);
  const items = visible.slice(offset, offset + pageSize);
  const next = offset + pageSize < visible.length ? String(offset + pageSize) : undefined;
  return {
    status: 200,
    headers: {},
    body: { kind: 'calendar#calendarList', items, ...(next ? { nextPageToken: next } : {}) },
  };
}

function hookContext({
  store,
  isRepublish,
  propsValue,
}: {
  store: Store;
  isRepublish?: boolean;
  propsValue?: Record<string, unknown>;
}): Parameters<typeof trigger.run>[0] {
  return triggerContext({
    value: {
      auth: fakeAuth,
      store,
      isRepublish,
      propsValue: propsValue ?? {},
      files: {},
    },
  });
}

type FakeCalendar = {
  kind: string;
  id: string;
  summary: string;
  accessRole: string;
  primary?: boolean;
  hidden?: boolean;
};
