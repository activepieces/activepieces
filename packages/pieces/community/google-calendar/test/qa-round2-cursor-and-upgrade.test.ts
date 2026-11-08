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

const ENDS_PROPS = {
  calendar_id: 'primary',
  specific_event: false,
  event_id: undefined,
};
