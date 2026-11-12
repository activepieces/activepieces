/// <reference types="vitest/globals" />

// C0951: New Calendar ("Fires when a new calendar is created or becomes
// accessible") stores as its "seen" snapshot only the calendars that pass the
// current filters and are not hidden. A calendar that was already in the list
// but outside the filter, or hidden, is therefore reported as a new calendar
// as soon as it is renamed into the filter, its access role changes, or it is
// unhidden.
//
// Stand-ins (mocks): httpClient.sendRequest is a fake Google
// users/me/calendarList endpoint that honours showHidden (Google omits entries
// with hidden: true unless showHidden=true). The store is an in-memory map.
// The trigger is driven through its real onEnable/run, which use
// pollingHelper from pieces-common.

import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { newCalendar } from '../src/lib/triggers/new-calendar';

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

type Cal = { id: string; summary: string; accessRole: string; primary?: boolean; hidden?: boolean; description?: string };

let calendarList: Cal[] = [];

function installFakeGoogle() {
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (!request.url.endsWith('/users/me/calendarList')) {
      throw new Error(`unexpected url ${request.url}`);
    }
    const q = (request.queryParams ?? {}) as Record<string, string>;
    const showHidden = q['showHidden'] === 'true';
    const minRole = q['minAccessRole'];
    const rank: Record<string, number> = { freeBusyReader: 0, reader: 1, writer: 2, owner: 3 };
    const items = calendarList
      .filter((c) => showHidden || !c.hidden)
      .filter((c) => !minRole || rank[c.accessRole] >= rank[minRole])
      .map((c) => ({ kind: 'calendar#calendarListEntry', ...c }));
    return { status: 200, headers: {}, body: { items } };
  });
}

function makeStore() {
  const data = new Map<string, unknown>();
  return {
    put: async <T>(key: string, value: T) => {
      data.set(key, value);
      return value;
    },
    get: async <T>(key: string) => (data.has(key) ? (data.get(key) as T) : null),
    delete: async (key: string) => {
      data.delete(key);
    },
  };
}

function ctx(store: ReturnType<typeof makeStore>, propsValue: Record<string, unknown>) {
  return { auth: AUTH, propsValue, store, files: {} } as never;
}

async function enableThenPollAfter(
  propsValue: Record<string, unknown>,
  initial: Cal[],
  change: (cals: Cal[]) => Cal[]
): Promise<string[]> {
  calendarList = initial;
  const store = makeStore();
  await newCalendar.onEnable(ctx(store, propsValue));
  const first = (await newCalendar.run(ctx(store, propsValue))) as { id: string }[];
  expect(first).toEqual([]);
  calendarList = change(calendarList.map((c) => ({ ...c })));
  const fired = (await newCalendar.run(ctx(store, propsValue))) as { id: string }[];
  return fired.map((c) => c.id);
}

beforeEach(() => {
  installFakeGoogle();
});

afterEach(() => {
  vi.restoreAllMocks();
});

const primary: Cal = { id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true };

describe('New Calendar only fires for calendars that are new to the account', () => {
  it('control: a calendar newly shared with the account and matching the name filter fires', async () => {
    const fired = await enableThenPollAfter({ calendar_name_filter: 'project' }, [primary], (cals) => [
      ...cals,
      { id: 'proj-x@group.calendar.google.com', summary: 'Project X', accessRole: 'writer' },
    ]);
    expect(fired).toEqual(['proj-x@group.calendar.google.com']);
  });

  it('renaming an existing calendar so it matches the name filter does not fire it as new', async () => {
    const team: Cal = { id: 'team@group.calendar.google.com', summary: 'Team', accessRole: 'owner' };
    const fired = await enableThenPollAfter({ calendar_name_filter: 'project' }, [primary, team], (cals) =>
      cals.map((c) => (c.id === team.id ? { ...c, summary: 'Project Team' } : c))
    );
    expect(fired).toEqual([]);
  });

  it('an existing shared calendar whose access role changes into the role filter does not fire as new', async () => {
    const ops: Cal = { id: 'ops@group.calendar.google.com', summary: 'Ops rota', accessRole: 'reader' };
    const fired = await enableThenPollAfter({ access_role_filter: ['writer'] }, [primary, ops], (cals) =>
      cals.map((c) => (c.id === ops.id ? { ...c, accessRole: 'writer' } : c))
    );
    expect(fired).toEqual([]);
  });

  it('hiding an existing calendar from the list and showing it again does not fire it as new', async () => {
    const holidays: Cal = { id: 'holidays@group.v.calendar.google.com', summary: 'Holidays', accessRole: 'reader' };
    calendarList = [primary, holidays];
    const store = makeStore();
    const propsValue = {};
    await newCalendar.onEnable(ctx(store, propsValue));
    calendarList = [primary, { ...holidays, hidden: true }];
    expect(await newCalendar.run(ctx(store, propsValue))).toEqual([]);
    calendarList = [primary, { ...holidays, hidden: false }];
    const fired = ((await newCalendar.run(ctx(store, propsValue))) as { id: string }[]).map((c) => c.id);
    expect(fired).toEqual([]);
  });
});
