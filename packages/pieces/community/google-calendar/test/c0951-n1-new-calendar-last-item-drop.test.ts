/// <reference types="vitest/globals" />

// C0951-n1 (new): New Calendar works out new calendars against its own stored
// snapshot, but run() still goes through pollingHelper's LAST_ITEM dedupe
// (pieces-common polling/index.ts:99-105), which cuts the list at the id of
// the first calendar fired in the previous non-empty poll. When that calendar
// shows up in the new list again (it was unshared and shared again), it and
// every new calendar listed after it are dropped, and because the snapshot was
// already updated they never fire.
//
// Stand-ins (mocks): httpClient.sendRequest is a fake Google
// users/me/calendarList endpoint; the store is an in-memory map. The trigger is
// driven through its real onEnable/run.

import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { newCalendar } from '../src/lib/triggers/new-calendar';

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

type Cal = { id: string; summary: string; accessRole: string; primary?: boolean };
let calendarList: Cal[] = [];

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

beforeEach(() => {
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (!request.url.endsWith('/users/me/calendarList')) {
      throw new Error(`unexpected url ${request.url}`);
    }
    return { status: 200, headers: {}, body: { items: calendarList } };
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

const primary: Cal = { id: 'me@example.com', summary: 'me@example.com', accessRole: 'owner', primary: true };
const sales: Cal = { id: 'sales@group.calendar.google.com', summary: 'Sales', accessRole: 'writer' };
const support: Cal = { id: 'support@group.calendar.google.com', summary: 'Support', accessRole: 'writer' };

async function poll(store: ReturnType<typeof makeStore>): Promise<string[]> {
  const c = { auth: AUTH, propsValue: {}, store, files: {} } as never;
  return ((await newCalendar.run(c)) as { id: string }[]).map((x) => x.id);
}

describe('New Calendar does not lose calendars listed after a re-shared one', () => {
  it('control: two calendars shared in one poll both fire', async () => {
    const store = makeStore();
    calendarList = [primary];
    await newCalendar.onEnable({ auth: AUTH, propsValue: {}, store, files: {} } as never);
    calendarList = [primary, sales, support];
    expect(await poll(store)).toEqual([sales.id, support.id]);
  });

  it('a calendar shared for the first time fires even when a previously fired calendar is re-shared in the same poll', async () => {
    const store = makeStore();
    calendarList = [primary];
    await newCalendar.onEnable({ auth: AUTH, propsValue: {}, store, files: {} } as never);

    calendarList = [primary, sales];
    expect(await poll(store)).toEqual([sales.id]);

    calendarList = [primary]; // Sales is unshared
    expect(await poll(store)).toEqual([]);

    calendarList = [primary, sales, support]; // Sales shared again, Support is brand new
    expect(await poll(store)).toContain(support.id);
  });
});
