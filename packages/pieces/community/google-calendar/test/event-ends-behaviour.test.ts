import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventEnds as trigger } from '../src/lib/triggers/event-ends';
import {
  addAllDayEvent,
  addTimedEvent,
  fakeAuth,
  fakeCalendar,
  idsOf,
  memoryStore,
  resetFakeCalendar,
  setNow,
  triggerContext,
} from './range-fake-google';

const WHOLE_CALENDAR = {
  calendar_id: 'primary',
  specific_event: false,
  event_id: undefined,
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetFakeCalendar();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Ends behaviour', () => {
  it('fires once when an event ends and never for events that ended before enable', async () => {
    addTimedEvent({ id: 'earlier', start: '2026-10-01T09:00:00Z', end: '2026-10-01T09:30:00Z' });
    addTimedEvent({ id: 'standup', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:07:00Z' });
    const fired = await pollAt({ props: WHOLE_CALENDAR, enableAt: '2026-10-01T10:00:00Z', times: ['10:05', '10:06:59', '10:10', '10:15'] });
    expect(fired).toEqual(['standup@10:10']);
  });

  it('fires every one of 300 events ending in one window once, over several pages', async () => {
    fakeCalendar.pageSize = 250;
    const ids = Array.from({ length: 300 }, (_, index) => `room-${index}`);
    ids.forEach((id, index) =>
      addTimedEvent({
        id,
        start: '2026-10-01T09:00:00Z',
        end: new Date(Date.parse('2026-10-01T10:01:00Z') + index * 500).toISOString(),
      })
    );
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    const fired = idsOf(await trigger.run(hookContext({ store })));
    expect(fired).toHaveLength(300);
    expect(new Set(fired)).toEqual(new Set(ids));
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires two events with the same end time across two checks, each once', async () => {
    addTimedEvent({ id: 'first', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:05:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['first']);
    addTimedEvent({ id: 'logged-late', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:05:00Z', created: '2026-10-01T10:05:20Z' });
    setNow({ iso: '2026-10-01T10:05:30Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['logged-late']);
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('reads an all-day end date in Sydney as midnight Sydney time', async () => {
    fakeCalendar.timeZone = 'Australia/Sydney';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-01', endDate: '2026-10-02' });
    const fired = await pollAt({ props: WHOLE_CALENDAR, enableAt: '2026-10-01T12:00:00Z', times: ['13:55', '14:00', '14:05', '23:55', '2026-10-02T00:05:00Z'] });
    expect(fired).toEqual(['offsite@14:00']);
  });

  it('never fires a cancelled pinned event', async () => {
    addTimedEvent({ id: 'board', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:30:00Z', status: 'cancelled' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'board' };
    const fired = await pollAt({ props, enableAt: '2026-10-01T10:00:00Z', times: ['10:30', '10:35'] });
    expect(fired).toEqual([]);
  });

  it('throws when the pinned event cannot be read and fires it at the next check', async () => {
    addTimedEvent({ id: 'board', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:30:00Z' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'board' };
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store, propsValue: props }));
    fakeCalendar.failNextGets = 1;
    setNow({ iso: '2026-10-01T10:30:00Z' });
    await expect(trigger.run(hookContext({ store, propsValue: props }))).rejects.toThrow();
    setNow({ iso: '2026-10-01T10:35:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: props })))).toEqual(['board']);
    setNow({ iso: '2026-10-01T10:40:00Z' });
    expect(await trigger.run(hookContext({ store, propsValue: props }))).toEqual([]);
  });

  it('returns nothing for a pinned event that was deleted for good', async () => {
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'missing' };
    const fired = await pollAt({ props, enableAt: '2026-10-01T10:00:00Z', times: ['10:05'] });
    expect(fired).toEqual([]);
  });

  it('keeps its position across a republish', async () => {
    addTimedEvent({ id: 'review', start: '2026-10-01T10:00:00Z', end: '2026-10-01T10:07:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
    setNow({ iso: '2026-10-01T10:08:00Z' });
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['review']);
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('resumes after the last end time the previous version fired, without repeating it', async () => {
    addTimedEvent({ id: 'fired-by-old-version', start: '2026-10-01T09:00:00Z', end: '2026-10-01T10:02:00Z' });
    addTimedEvent({ id: 'missed-during-upgrade', start: '2026-10-01T09:00:00Z', end: '2026-10-01T10:04:00Z' });
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T10:02:00Z'));
    setNow({ iso: '2026-10-01T10:04:30Z' });
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['missed-during-upgrade']);
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('test() returns events that already ended, latest end first', async () => {
    addTimedEvent({ id: 'morning', start: '2026-10-01T08:00:00Z', end: '2026-10-01T08:30:00Z' });
    addTimedEvent({ id: 'lunch', start: '2026-10-01T11:00:00Z', end: '2026-10-01T11:30:00Z' });
    addTimedEvent({ id: 'ongoing', start: '2026-10-01T11:45:00Z', end: '2026-10-01T12:30:00Z' });
    addTimedEvent({ id: 'later', start: '2026-10-01T15:00:00Z', end: '2026-10-01T16:00:00Z' });
    setNow({ iso: '2026-10-01T12:00:00Z' });
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store, propsValue: { calendar_id: 'primary' } }));
    expect(idsOf(sample)).toEqual(['lunch', 'morning']);
  });
});

async function pollAt({
  props,
  enableAt,
  times,
}: {
  props: Record<string, unknown>;
  enableAt: string;
  times: string[];
}): Promise<string[]> {
  const { store } = memoryStore();
  setNow({ iso: enableAt });
  await trigger.onEnable(hookContext({ store, propsValue: props }));
  const fired: string[] = [];
  for (const time of times) {
    setNow({ iso: time.includes('T') ? time : `${enableAt.slice(0, 10)}T${time}${time.length === 5 ? ':00' : ''}Z` });
    const out = await trigger.run(hookContext({ store, propsValue: props }));
    fired.push(...idsOf(out).map((id) => `${id}@${time}`));
  }
  return fired;
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
      propsValue: propsValue ?? WHOLE_CALENDAR,
      files: {},
    },
  });
}
