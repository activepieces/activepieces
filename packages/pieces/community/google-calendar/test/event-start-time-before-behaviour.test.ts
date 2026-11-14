import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventStartTimeBefore as trigger } from '../src/lib/triggers/event-start-time-before';
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
  time_value: 15,
  time_unit: 'minutes',
};

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetFakeCalendar();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Start (Time Before) behaviour', () => {
  it('fires at the start when Time Before is 0', async () => {
    addTimedEvent({ id: 'standup', start: '2026-10-01T10:03:00Z', end: '2026-10-01T10:18:00Z' });
    const props = { ...WHOLE_CALENDAR, time_value: 0 };
    const fired = await pollAt({ props, enableAt: '2026-10-01T09:55:00Z', times: ['10:00', '10:05', '10:10'] });
    expect(fired).toEqual(['standup@10:05']);
  });

  it('fires a reminder at the next check after a check that failed', async () => {
    addTimedEvent({ id: 'review', start: '2026-10-01T10:22:00Z', end: '2026-10-01T11:00:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
    fakeCalendar.failNextLists = 1;
    setNow({ iso: '2026-10-01T10:10:00Z' });
    await expect(trigger.run(hookContext({ store }))).rejects.toThrow();
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['review']);
    setNow({ iso: '2026-10-01T10:20:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
  });

  it('fires a reminder that is due exactly at a check that runs 1.5 s late, once', async () => {
    addTimedEvent({ id: 'sync', start: '2026-10-01T10:20:00Z', end: '2026-10-01T10:50:00Z' });
    const fired = await pollAt({
      props: WHOLE_CALENDAR,
      enableAt: '2026-10-01T10:00:00Z',
      times: ['10:00:01.500', '10:05:01.500', '10:10:01.500', '10:15:00'],
    });
    expect(fired).toEqual(['sync@10:05:01.500']);
  });

  it('never fires a reminder before it is due', async () => {
    addTimedEvent({ id: 'later', start: '2026-10-01T10:24:00Z', end: '2026-10-01T10:50:00Z' });
    const fired = await pollAt({ props: WHOLE_CALENDAR, enableAt: '2026-10-01T10:00:00Z', times: ['10:05', '10:08:59', '10:09:00', '10:14'] });
    expect(fired).toEqual(['later@10:09:00']);
  });

  it('covers every reminder with a 10-minute check interval', async () => {
    addTimedEvent({ id: 'checkin', start: '2026-10-01T10:22:00Z', end: '2026-10-01T10:25:00Z' });
    addTimedEvent({ id: 'planning', start: '2026-10-01T10:40:00Z', end: '2026-10-01T11:10:00Z' });
    const fired = await pollAt({ props: WHOLE_CALENDAR, enableAt: '2026-10-01T10:00:00Z', times: ['10:10', '10:20', '10:30', '10:40'] });
    expect(fired).toEqual(['checkin@10:10', 'planning@10:30']);
  });

  it('fires a last-minute booking next to an already-fired reminder with the same due time', async () => {
    addTimedEvent({ id: 'first', start: '2026-10-01T10:20:00Z', end: '2026-10-01T10:50:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['first']);
    addTimedEvent({ id: 'second', start: '2026-10-01T10:20:00Z', end: '2026-10-01T10:50:00Z', created: '2026-10-01T10:06:00Z' });
    addTimedEvent({ id: 'squeezed-in', start: '2026-10-01T10:18:00Z', end: '2026-10-01T10:30:00Z', created: '2026-10-01T10:12:00Z' });
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['second']);
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['squeezed-in']);
    setNow({ iso: '2026-10-01T10:20:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
  });

  it('does not fire for a meeting logged after it already started', async () => {
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    addTimedEvent({ id: 'logged', start: '2026-10-01T09:30:00Z', end: '2026-10-01T10:30:00Z', created: '2026-10-01T10:02:00Z' });
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
  });

  it('drops a late reminder once the meeting has started (whole calendar)', async () => {
    addTimedEvent({ id: 'client-call', start: '2026-10-01T09:30:00Z', end: '2026-10-01T11:00:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T09:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:00:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
    setNow({ iso: '2026-10-01T10:05:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
  });

  it('drops a late reminder once the meeting has started (specific event)', async () => {
    addTimedEvent({ id: 'client-call', start: '2026-10-01T09:30:00Z', end: '2026-10-01T11:00:00Z' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'client-call' };
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T09:00:00Z' });
    await trigger.onEnable(hookContext({ store, propsValue: props }));
    setNow({ iso: '2026-10-01T10:00:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: props })))).toEqual([]);
  });

  it('still delivers a late reminder while the meeting has not started', async () => {
    addTimedEvent({ id: 'standup', start: '2026-10-01T10:17:00Z', end: '2026-10-01T10:32:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T09:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:00:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual([]);
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['standup']);
  });

  it('refuses to turn on when Target Specific Event has no event', async () => {
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: undefined };
    const { store } = memoryStore();
    await expect(trigger.onEnable(hookContext({ store, propsValue: props }))).rejects.toThrow('Select the event to watch');
  });

  it('reads an all-day event in Sydney as midnight Sydney time', async () => {
    fakeCalendar.timeZone = 'Australia/Sydney';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-02', endDate: '2026-10-03' });
    const props = { ...WHOLE_CALENDAR, time_value: 1, time_unit: 'hours' };
    const fired = await pollAt({
      props,
      enableAt: '2026-10-01T12:00:00Z',
      times: ['12:55', '13:00', '13:05', '23:00', '23:05'],
    });
    expect(fired).toEqual(['offsite@13:00']);
  });

  it('reads an all-day event in Los Angeles as midnight Los Angeles time', async () => {
    fakeCalendar.timeZone = 'America/Los_Angeles';
    addAllDayEvent({ id: 'holiday', startDate: '2026-10-02', endDate: '2026-10-03' });
    const props = { ...WHOLE_CALENDAR, time_value: 1, time_unit: 'hours' };
    const fired = await pollAt({
      props,
      enableAt: '2026-10-01T22:00:00Z',
      times: ['23:00', '23:05', '2026-10-02T05:55:00Z', '2026-10-02T06:00:00Z', '2026-10-02T06:05:00Z'],
    });
    expect(fired).toEqual(['holiday@2026-10-02T06:00:00Z']);
  });

  it('reads a pinned all-day event in the calendar time zone', async () => {
    fakeCalendar.timeZone = 'Australia/Sydney';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-02', endDate: '2026-10-03' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'offsite', time_value: 1, time_unit: 'hours' };
    const fired = await pollAt({ props, enableAt: '2026-10-01T12:00:00Z', times: ['12:55', '13:00', '13:05'] });
    expect(fired).toEqual(['offsite@13:00']);
  });

  it('fires every one of 300 reminders due in one window once, over several pages', async () => {
    fakeCalendar.pageSize = 250;
    const ids = Array.from({ length: 300 }, (_, index) => `bulk-${index}`);
    ids.forEach((id, index) =>
      addTimedEvent({
        id,
        start: new Date(Date.parse('2026-10-01T10:20:00Z') + index * 500).toISOString(),
        end: '2026-10-01T11:00:00Z',
      })
    );
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:10:00Z' });
    const fired = idsOf(await trigger.run(hookContext({ store })));
    expect(fired).toHaveLength(300);
    expect(new Set(fired)).toEqual(new Set(ids));
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('keeps the reminders of a page that failed for the next check', async () => {
    fakeCalendar.pageSize = 2;
    ['a', 'b', 'c', 'd', 'e'].forEach((id, index) =>
      addTimedEvent({ id, start: `2026-10-01T10:2${index}:00Z`, end: '2026-10-01T11:00:00Z' })
    );
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    fakeCalendar.failListPage = 1;
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['a', 'b']);
    setNow({ iso: '2026-10-01T10:20:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['c', 'd', 'e']);
    setNow({ iso: '2026-10-01T10:25:00Z' });
    expect(await trigger.run(hookContext({ store }))).toEqual([]);
  });

  it('fires a rescheduled pinned event once at its new time', async () => {
    const event = addTimedEvent({ id: 'board', start: '2026-10-01T10:20:00Z', end: '2026-10-01T11:00:00Z' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'board' };
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store, propsValue: props }));
    const fired: string[] = [];
    for (const time of ['10:05', '10:10', '10:40', '10:45', '10:50']) {
      if (time === '10:10') {
        event.start = { dateTime: '2026-10-01T11:00:00Z' };
        event.end = { dateTime: '2026-10-01T11:30:00Z' };
      }
      setNow({ iso: `2026-10-01T${time}:00Z` });
      fired.push(...idsOf(await trigger.run(hookContext({ store, propsValue: props }))).map((id) => `${id}@${time}`));
    }
    expect(fired).toEqual(['board@10:05', 'board@10:45']);
  });

  it('never fires a cancelled pinned event', async () => {
    addTimedEvent({ id: 'board', start: '2026-10-01T10:20:00Z', end: '2026-10-01T11:00:00Z', status: 'cancelled' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'board' };
    const fired = await pollAt({ props, enableAt: '2026-10-01T10:00:00Z', times: ['10:05', '10:10', '10:15'] });
    expect(fired).toEqual([]);
  });

  it('throws when the pinned event cannot be read and fires it at the next check', async () => {
    addTimedEvent({ id: 'board', start: '2026-10-01T10:20:00Z', end: '2026-10-01T11:00:00Z' });
    const props = { ...WHOLE_CALENDAR, specific_event: true, event_id: 'board' };
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store, propsValue: props }));
    fakeCalendar.failNextGets = 1;
    setNow({ iso: '2026-10-01T10:05:00Z' });
    await expect(trigger.run(hookContext({ store, propsValue: props }))).rejects.toThrow();
    setNow({ iso: '2026-10-01T10:10:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: props })))).toEqual(['board']);
  });

  it('keeps its position across a republish with the same settings', async () => {
    addTimedEvent({ id: 'review', start: '2026-10-01T10:22:00Z', end: '2026-10-01T11:00:00Z' });
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

  it('starts from the republish when Time Before changes', async () => {
    addTimedEvent({ id: 'review', start: '2026-10-01T10:40:00Z', end: '2026-10-01T11:00:00Z' });
    addTimedEvent({ id: 'retro', start: '2026-10-01T11:00:00Z', end: '2026-10-01T11:30:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    const props = { ...WHOLE_CALENDAR, time_value: 30 };
    setNow({ iso: '2026-10-01T10:12:00Z' });
    await trigger.onEnable(hookContext({ store, isRepublish: true, propsValue: props }));
    setNow({ iso: '2026-10-01T10:15:00Z' });
    expect(await trigger.run(hookContext({ store, propsValue: props }))).toEqual([]);
    setNow({ iso: '2026-10-01T10:30:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store, propsValue: props })))).toEqual(['retro']);
  });

  it('checks at most 7 days back after a long pause and logs it', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    addTimedEvent({ id: 'old', start: '2026-10-20T10:15:00Z', end: '2026-10-20T11:00:00Z' });
    addTimedEvent({ id: 'recent', start: '2026-10-31T10:10:00Z', end: '2026-10-31T11:00:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-31T10:00:00Z' });
    expect(idsOf(await trigger.run(hookContext({ store })))).toEqual(['recent']);
    expect(warn.mock.calls.some((call) => String(call[0]).includes('more than 7 days ago'))).toBe(true);
  });

  it('does not re-fire a reminder the previous version already sent', async () => {
    addTimedEvent({ id: 'sent-by-old-version', start: '2026-10-01T10:18:00Z', end: '2026-10-01T11:00:00Z' });
    addTimedEvent({ id: 'next', start: '2026-10-01T10:40:00Z', end: '2026-10-01T11:00:00Z' });
    const { store } = memoryStore();
    await store.put('lastPoll', Date.parse('2026-10-01T10:03:00Z'));
    setNow({ iso: '2026-10-01T10:00:30Z' });
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    const fired: string[] = [];
    for (const time of ['10:05', '10:10', '10:25', '10:30']) {
      setNow({ iso: `2026-10-01T${time}:00Z` });
      fired.push(...idsOf(await trigger.run(hookContext({ store }))));
    }
    expect(fired).toEqual(['next']);
  });

  it('test() with blank optional props returns upcoming live events, soonest first', async () => {
    addTimedEvent({ id: 'past', start: '2026-10-01T08:00:00Z', end: '2026-10-01T09:00:00Z' });
    addTimedEvent({ id: 'tomorrow', start: '2026-10-02T10:00:00Z', end: '2026-10-02T11:00:00Z' });
    addTimedEvent({ id: 'today', start: '2026-10-01T15:00:00Z', end: '2026-10-01T16:00:00Z' });
    addTimedEvent({ id: 'gone', start: '2026-10-01T14:00:00Z', end: '2026-10-01T15:00:00Z', status: 'cancelled' });
    setNow({ iso: '2026-10-01T12:00:00Z' });
    const { store } = memoryStore();
    const sample = await trigger.test(hookContext({ store, propsValue: { calendar_id: 'primary', time_value: 15, time_unit: 'minutes' } }));
    expect(idsOf(sample)).toEqual(['today', 'tomorrow']);
  });

  it('every sampleData key exists in a fired event', async () => {
    addTimedEvent({ id: 'review', start: '2026-10-01T10:20:00Z', end: '2026-10-01T11:00:00Z' });
    const { store } = memoryStore();
    setNow({ iso: '2026-10-01T10:00:00Z' });
    await trigger.onEnable(hookContext({ store }));
    setNow({ iso: '2026-10-01T10:05:00Z' });
    const [fired] = await trigger.run(hookContext({ store }));
    for (const key of ['kind', 'id', 'status', 'created', 'updated', 'summary', 'start', 'end']) {
      expect(Object.keys(trigger.sampleData)).toContain(key);
      expect(fired).toHaveProperty(key);
    }
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
