/// <reference types="vitest/globals" />

import { Store } from '@activepieces/pieces-framework';

const calendarsInAccount: { id: string; summary: string; accessRole: string; primary: boolean }[] = [];
const getCalendarsMock = vi.fn(async () => calendarsInAccount);

vi.mock('../src/lib/common/helper', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../src/lib/common/helper')>();
  return { ...actual, getCalendars: () => getCalendarsMock() };
});

import { newCalendar } from '../src/lib/triggers/new-calendar';

describe('newCalendar republish', () => {
  beforeEach(() => {
    calendarsInAccount.length = 0;
    getCalendarsMock.mockClear();
  });

  it('keeps the calendar snapshot, so a calendar created just before the republish still fires', async () => {
    calendarsInAccount.push(calendar('work'), calendar('personal'));
    const { store, data } = memoryStore();
    await newCalendar.onEnable(hookContext({ store }));
    expect(data.get('calendars')).toEqual(['work', 'personal']);

    calendarsInAccount.push(calendar('travel'));
    await newCalendar.onDisable(hookContext({ store, isRepublish: true }));
    await newCalendar.onEnable(hookContext({ store, isRepublish: true }));
    expect(data.get('calendars')).toEqual(['work', 'personal']);

    const emitted = await newCalendar.run(hookContext({ store }));
    expect(emitted.map((item) => (item as { id: string }).id)).toEqual(['travel']);
  });

  it('starts from the current calendars when the flow is turned off and on', async () => {
    calendarsInAccount.push(calendar('work'));
    const { store, data } = memoryStore();
    await newCalendar.onEnable(hookContext({ store }));

    calendarsInAccount.push(calendar('travel'));
    await newCalendar.onDisable(hookContext({ store }));
    await newCalendar.onEnable(hookContext({ store }));

    expect(data.get('calendars')).toEqual(['work', 'travel']);
  });
});

function calendar(id: string): { id: string; summary: string; accessRole: string; primary: boolean } {
  return { id, summary: id, accessRole: 'owner', primary: false };
}

function hookContext({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Parameters<typeof newCalendar.run>[0] {
  return {
    store,
    isRepublish,
    auth: {},
    propsValue: { access_role_filter: undefined, calendar_name_filter: undefined, exclude_shared: false },
    files: {},
  } as unknown as Parameters<typeof newCalendar.run>[0];
}

function memoryStore(): { store: Store; data: Map<string, unknown> } {
  const data = new Map<string, unknown>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, value);
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      return (data.get(key) as T) ?? null;
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}
