import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventStartTimeBefore } from '../src/lib/triggers/event-start-time-before';
import { eventEnds } from '../src/lib/triggers/event-ends';
import { eventCancelled } from '../src/lib/triggers/event-cancelled';
import {
  addTimedEvent,
  fakeAuth,
  fakeCalendar,
  idsOf,
  memoryStore,
  resetFakeCalendar,
  setNow,
} from './range-fake-google';

const DAY_MS = 24 * 60 * 60 * 1000;

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetFakeCalendar();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Start (Time Before) and Event Ends move their position on every clean check', () => {
  it('Time Before saves the check time and lists from it on the next check, with no catch-up warning after 8 quiet days', async () => {
    const { store, data } = memoryStore();
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const enabledAtMs = Date.parse('2026-10-01T10:00:00Z');
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await eventStartTimeBefore.onEnable(reminderContext({ store, propsValue: TIME_BEFORE_PROPS }));
    for (let day = 1; day <= 8; day++) {
      vi.setSystemTime(enabledAtMs + day * DAY_MS);
      expect(await eventStartTimeBefore.run(reminderContext({ store, propsValue: TIME_BEFORE_PROPS }))).toEqual([]);
      expect(savedDueThrough({ data, key: 'event_start_checkpoint' })).toBe(enabledAtMs + day * DAY_MS);
    }
    const lastList = fakeCalendar.requests[fakeCalendar.requests.length - 1];
    expect(Date.parse(lastList.query['timeMin'])).toBe(enabledAtMs + 7 * DAY_MS - 60_000 - 14 * 60 * 60 * 1000);
    expect(warn.mock.calls.some((call) => String(call[0]).includes('more than 7 days ago'))).toBe(false);
  });

  it('Event Ends fires an end once and does not re-list a window it already checked', async () => {
    addTimedEvent({ id: 'call', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:30:00Z' });
    const { store, data } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await eventEnds.onEnable(reminderContext({ store, propsValue: ENDS_PROPS }));
    const fired: string[] = [];
    for (const time of ['10:20', '10:40', '11:00']) {
      setNow({ iso: `2026-10-01T${time}:00Z` });
      fired.push(...idsOf(await eventEnds.run(reminderContext({ store, propsValue: ENDS_PROPS }))));
    }
    expect(fired).toEqual(['call']);
    expect(savedDueThrough({ data, key: 'event_ends_checkpoint' })).toBe(Date.parse('2026-10-01T11:00:00Z'));
  });
});

describe('Event Cancelled (Target Specific Event) after an upgrade', () => {
  it('does not fire again for a cancellation the previous version already fired', async () => {
    addTimedEvent({
      id: 'pinned',
      start: '2026-10-05T10:00:00Z',
      end: '2026-10-05T11:00:00Z',
      created: '2026-10-01T09:00:00.000Z',
      status: 'cancelled',
    });
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T09:00:00.000Z'));
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await eventCancelled.onEnable(cancelledContext({ store, isRepublish: true }));
    expect(await eventCancelled.run(cancelledContext({ store }))).toEqual([]);
    expect(await eventCancelled.run(cancelledContext({ store }))).toEqual([]);
  });

  it('still fires a cancellation newer than the previous version\'s last check', async () => {
    addTimedEvent({
      id: 'pinned',
      start: '2026-10-05T10:00:00Z',
      end: '2026-10-05T11:00:00Z',
      created: '2026-10-01T09:30:00.000Z',
      status: 'cancelled',
    });
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T09:00:00.000Z'));
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await eventCancelled.onEnable(cancelledContext({ store, isRepublish: true }));
    expect(idsOf(await eventCancelled.run(cancelledContext({ store })))).toEqual(['pinned']);
    expect(await eventCancelled.run(cancelledContext({ store }))).toEqual([]);
  });
});

describe('Event Start (Time Before) and Event Ends upgrade marker', () => {
  it('Time Before fires a meeting booked after the upgrade even when the previous version saved a future position', async () => {
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T23:45:00Z'));
    setNow({ iso: '2026-10-01T13:02:00Z' });
    await eventStartTimeBefore.onEnable(reminderContext({ store, propsValue: TIME_BEFORE_PROPS, isRepublish: true }));
    addTimedEvent({ id: 'late-booking', start: '2026-10-01T13:20:00Z', end: '2026-10-01T13:50:00Z', created: '2026-10-01T13:10:00.000Z' });
    setNow({ iso: '2026-10-01T13:12:00Z' });
    expect(idsOf(await eventStartTimeBefore.run(reminderContext({ store, propsValue: TIME_BEFORE_PROPS })))).toEqual(['late-booking']);
    setNow({ iso: '2026-10-01T13:17:00Z' });
    expect(await eventStartTimeBefore.run(reminderContext({ store, propsValue: TIME_BEFORE_PROPS }))).toEqual([]);
  });

  it('Time Before fires, at the first check after the upgrade, a reminder the previous version skipped just before it', async () => {
    addTimedEvent({ id: 'skipped-by-previous', start: '2026-10-01T10:20:01Z', end: '2026-10-01T10:50:00Z' });
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T10:00:00Z'));
    setNow({ iso: '2026-10-01T10:07:00Z' });
    await eventStartTimeBefore.onEnable(reminderContext({ store, propsValue: TIME_BEFORE_PROPS, isRepublish: true }));
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(idsOf(await eventStartTimeBefore.run(reminderContext({ store, propsValue: TIME_BEFORE_PROPS })))).toEqual(['skipped-by-previous']);
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(await eventStartTimeBefore.run(reminderContext({ store, propsValue: TIME_BEFORE_PROPS }))).toEqual([]);
  });

  it('Event Ends drops the upgrade marker from its saved position once the upgrade window has passed', async () => {
    const { store, data } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T10:00:00Z'));
    setNow({ iso: '2026-10-01T10:30:00Z' });
    await eventEnds.onEnable(reminderContext({ store, propsValue: ENDS_PROPS, isRepublish: true }));
    setNow({ iso: '2026-10-01T10:35:00Z' });
    await eventEnds.run(reminderContext({ store, propsValue: ENDS_PROPS }));
    expect(hasLegacyMarker({ data, key: 'event_ends_checkpoint' })).toBe(true);
    setNow({ iso: '2026-10-02T01:00:00Z' });
    await eventEnds.run(reminderContext({ store, propsValue: ENDS_PROPS }));
    expect(hasLegacyMarker({ data, key: 'event_ends_checkpoint' })).toBe(false);
  });
});

describe('Event Start (Time Before) handled mark on an unfinished listing that fires more than the seen limit', () => {
  it('keeps the handled mark through a check that fires nothing, so a later rejected page position fires nothing twice', async () => {
    addReminders({ count: 1200, firstDueIso: '2026-10-01T10:05:00Z', spacingMs: 200 });
    addReminders({ count: 1800, firstDueIso: '2026-10-01T10:30:00Z', spacingMs: 200, prefix: 'later' });
    const fired = await checkEveryFiveMinutes({ rejectTokenAtCheck: 3 });
    expectEachOnce({ fired });
  });

  it('does not fire again, in the next listing, reminders the seen limit removed in the last minute of a finished listing', async () => {
    addReminders({ count: 1200, firstDueIso: '2026-10-01T10:09:00.020Z', spacingMs: 49 });
    addReminders({ count: 600, firstDueIso: '2026-10-01T10:30:00Z', spacingMs: 1000, prefix: 'later' });
    const fired = await checkEveryFiveMinutes({});
    expectEachOnce({ fired });
  });

  it('fires nothing twice when the seen limit is reached inside a group of reminders with the same start', async () => {
    addReminders({ count: 1500, firstDueIso: '2026-10-01T10:05:00Z', spacingMs: 0 });
    const fired = await checkEveryFiveMinutes({ rejectTokenAtCheck: 2 });
    expectEachOnce({ fired });
  });

  it('honours a floor the previous build raised in the middle of a listing when the saved page is rejected', async () => {
    addReminders({ count: 1500, firstDueIso: '2026-10-01T10:05:00Z', spacingMs: 200 });
    const { store, data } = memoryStore();
    fakeCalendar.pageSize = 600;
    fakeCalendar.listDelayMs = 8_000;
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await eventStartTimeBefore.onEnable(reminderContext({ store, propsValue: BURST_PROPS }));
    setNow({ iso: '2026-10-01T10:10:00Z' });
    const fired = idsOf(await eventStartTimeBefore.run(reminderContext({ store, propsValue: BURST_PROPS })));
    data.set('event_start_checkpoint', JSON.stringify(asPreviousBuildCheckpoint({ raw: data.get('event_start_checkpoint') })));
    for (const [index, time] of ['10:15', '10:20', '10:25'].entries()) {
      fakeCalendar.rejectNextPageToken = index === 0;
      setNow({ iso: `2026-10-01T${time}:00Z` });
      fired.push(...idsOf(await eventStartTimeBefore.run(reminderContext({ store, propsValue: BURST_PROPS }))));
    }
    expect(fired).toHaveLength(1500);
    expect(new Set(fired).size).toBe(1500);
  });
});

function addReminders({ count, firstDueIso, spacingMs, prefix }: { count: number; firstDueIso: string; spacingMs: number; prefix?: string }): void {
  const firstStartMs = Date.parse(firstDueIso) + BURST_LEAD_MS;
  for (let index = 0; index < count; index++) {
    const startMs = firstStartMs + index * spacingMs;
    addTimedEvent({ id: `${prefix ?? 'burst'}-${index}`, start: new Date(startMs).toISOString(), end: new Date(startMs + 30 * 60 * 1000).toISOString() });
  }
}

async function checkEveryFiveMinutes({ rejectTokenAtCheck }: { rejectTokenAtCheck?: number }): Promise<string[]> {
  const { store } = memoryStore();
  fakeCalendar.pageSize = 600;
  fakeCalendar.listDelayMs = 8_000;
  setNow({ iso: '2026-10-01T10:00:00Z' });
  await eventStartTimeBefore.onEnable(reminderContext({ store, propsValue: BURST_PROPS }));
  const fired: string[] = [];
  for (let check = 1; check <= 20; check++) {
    fakeCalendar.rejectNextPageToken = check === rejectTokenAtCheck;
    vi.setSystemTime(Date.parse('2026-10-01T10:05:00Z') + check * 5 * 60 * 1000);
    fired.push(...idsOf(await eventStartTimeBefore.run(reminderContext({ store, propsValue: BURST_PROPS }))));
  }
  return fired;
}

function expectEachOnce({ fired }: { fired: string[] }): void {
  const expected = fakeCalendar.events.map((event) => event.id).sort();
  expect([...fired].sort()).toEqual(expected);
}

function asPreviousBuildCheckpoint({ raw }: { raw: string | undefined }): Record<string, unknown> {
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null || !('seen' in parsed) || !Array.isArray(parsed.seen)) {
    throw new Error('no checkpoint');
  }
  const seen: { key: string; untilMs: number }[] = parsed.seen.map((entry: unknown) => ({
    key: String(Reflect.get(Object(entry), 'key')),
    untilMs: Number(Reflect.get(Object(entry), 'untilMs')),
  }));
  const newestFirst = [...seen].sort((left, right) => right.untilMs - left.untilMs);
  const cutMs = newestFirst[Math.min(999, newestFirst.length - 1)].untilMs;
  return {
    ...parsed,
    handled: undefined,
    floorMs: cutMs,
    seen: newestFirst.filter((entry) => entry.untilMs > cutMs),
  };
}

function hasLegacyMarker({ data, key }: { data: Map<string, string>; key: string }): boolean {
  const raw = data.get(key);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  return typeof parsed === 'object' && parsed !== null && 'legacy' in parsed;
}

function savedDueThrough({ data, key }: { data: Map<string, string>; key: string }): number {
  const raw = data.get(key);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'dueThroughMs' in parsed && typeof parsed.dueThroughMs === 'number') {
    return parsed.dueThroughMs;
  }
  throw new Error(`no checkpoint under ${key}`);
}

function reminderContext({ store, propsValue, isRepublish }: { store: Store; propsValue: Record<string, unknown>; isRepublish?: boolean }): Parameters<typeof eventStartTimeBefore.run>[0] {
  return Reflect.apply(buildContext, undefined, [{ store, propsValue, isRepublish: isRepublish === true }]);
}

function cancelledContext({ store, isRepublish }: { store: Store; isRepublish?: boolean }): Parameters<typeof eventCancelled.run>[0] {
  return Reflect.apply(buildContext, undefined, [
    {
      store,
      isRepublish: isRepublish === true,
      propsValue: { calendar_id: 'primary', specific_event: true, event_id: 'pinned', cancellation_reason: undefined },
    },
  ]);
}

function buildContext({ store, propsValue, isRepublish }: { store: Store; propsValue: Record<string, unknown>; isRepublish: boolean }) {
  return { auth: fakeAuth, store, isRepublish, propsValue, files: {} };
}

const TIME_BEFORE_PROPS = {
  calendar_id: 'primary',
  specific_event: false,
  event_id: undefined,
  time_value: 15,
  time_unit: 'minutes',
};

// A 2-hour lead keeps every burst meeting in the future while the listing is
// spread over several checks; reminders after the start are dropped.
const BURST_LEAD_MS = 2 * 60 * 60 * 1000;
const BURST_PROPS = { ...TIME_BEFORE_PROPS, time_value: 2, time_unit: 'hours' };

const ENDS_PROPS = {
  calendar_id: 'primary',
  specific_event: false,
  event_id: undefined,
};
