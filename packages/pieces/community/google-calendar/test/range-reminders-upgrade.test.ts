import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventEnds } from '../src/lib/triggers/event-ends';
import { eventStartTimeBefore } from '../src/lib/triggers/event-start-time-before';
import {
  addAllDayEvent,
  addTimedEvent,
  fakeAuth,
  fakeCalendar,
  FakeEvent,
  googleTimeMs,
  idsOf,
  memoryStore,
  resetFakeCalendar,
  triggerContext,
} from './range-fake-google';

const HOUR_MS = 60 * 60 * 1000;
const MINUTE_MS = 60 * 1000;
const PREVIOUS_POLL_MS = 5 * MINUTE_MS;
const NEW_POLL_MS = 30 * MINUTE_MS;
// Longer than NEW_POLL_MS, so each reminder's check comes before its meeting starts.
const LEAD_MS = 60 * MINUTE_MS;
const DAY_START_MS = Date.parse('2026-10-02T00:00:00Z');
const ZONES = ['UTC', 'America/Los_Angeles', 'Australia/Sydney'];
const UPGRADE_HOURS = Array.from({ length: 29 }, (_, index) => index - 14);
const ENDS_PROPS = { calendar_id: 'primary', specific_event: false };
const TIME_BEFORE_PROPS = { calendar_id: 'primary', specific_event: false, time_value: 60, time_unit: 'minutes' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetFakeCalendar();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Ends after an upgrade from the previous version', () => {
  it('does not fire an all-day end again in Los Angeles when the previous version already fired it', async () => {
    fakeCalendar.timeZone = 'America/Los_Angeles';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-01', endDate: '2026-10-02' });
    const result = await upgradeRun({ trigger: 'ends', upgradeAtMs: DAY_START_MS + 2 * HOUR_MS });
    expect(result.previous).toEqual(['offsite']);
    expect(result.current).toEqual([]);
  });

  it('fires an all-day end in Sydney that the previous version had not fired when a later timed end moved its position', async () => {
    fakeCalendar.timeZone = 'Australia/Sydney';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-01', endDate: '2026-10-02' });
    addTimedEvent({ id: 'call', start: '2026-10-01T20:30:00Z', end: '2026-10-01T21:00:00Z' });
    const result = await upgradeRun({ trigger: 'ends', upgradeAtMs: DAY_START_MS - 2 * HOUR_MS });
    expect(result.previous).toEqual(['call']);
    expect(result.current).toEqual(['offsite']);
  });

  for (const zone of ZONES) {
    it(`fires every end exactly once across the upgrade in ${zone}, for every upgrade hour from D-14 h to D+14 h`, async () => {
      const failures: string[] = [];
      for (const hour of UPGRADE_HOURS) {
        resetFakeCalendar();
        fakeCalendar.timeZone = zone;
        addAllDayEvent({ id: 'all-day', startDate: '2026-10-01', endDate: '2026-10-02' });
        for (const offsetHours of [-12, -3, 3, 12]) {
          const endMs = DAY_START_MS + offsetHours * HOUR_MS;
          addTimedEvent({ id: `timed${offsetHours}`, start: new Date(endMs - 30 * MINUTE_MS).toISOString(), end: new Date(endMs).toISOString() });
        }
        const result = await upgradeRun({ trigger: 'ends', upgradeAtMs: DAY_START_MS + hour * HOUR_MS });
        failures.push(...countProblems({ hour, result }));
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('Event Start (Time Before) after an upgrade from the previous version', () => {
  it('fires a timed reminder in Sydney that falls before the future position the previous version saved', async () => {
    fakeCalendar.timeZone = 'Australia/Sydney';
    addAllDayEvent({ id: 'offsite', startDate: '2026-10-02', endDate: '2026-10-03' });
    addTimedEvent({ id: 'call', start: '2026-10-01T21:00:00Z', end: '2026-10-01T21:30:00Z' });
    const result = await upgradeRun({ trigger: 'time-before', upgradeAtMs: DAY_START_MS - 5 * HOUR_MS });
    expect(result.previous).toEqual(['offsite']);
    expect(result.current).toEqual(['call']);
  });

  it('does not fire again a reminder the previous version sent up to 5 minutes early', async () => {
    addTimedEvent({ id: 'call', start: '2026-10-02T00:18:00Z', end: '2026-10-02T00:48:00Z' });
    const result = await upgradeRun({ trigger: 'time-before', upgradeAtMs: Date.parse('2026-10-02T00:00:30Z') });
    expect(result.previous).toEqual(['call']);
    expect(result.current).toEqual([]);
  });

  for (const zone of ZONES) {
    it(`never fires a reminder twice across the upgrade in ${zone} and loses none the previous version had not lost, for every upgrade hour from D-14 h to D+14 h`, async () => {
      const failures: string[] = [];
      for (const hour of UPGRADE_HOURS) {
        resetFakeCalendar();
        fakeCalendar.timeZone = zone;
        addAllDayEvent({ id: 'all-day', startDate: '2026-10-02', endDate: '2026-10-03' });
        for (const offsetHours of [-12, 3, 12]) {
          const startMs = DAY_START_MS + offsetHours * HOUR_MS;
          addTimedEvent({ id: `timed${offsetHours}`, start: new Date(startMs).toISOString(), end: new Date(startMs + 30 * MINUTE_MS).toISOString() });
        }
        const result = await upgradeRun({ trigger: 'time-before', upgradeAtMs: DAY_START_MS + hour * HOUR_MS });
        failures.push(...countProblems({ hour, result }));
      }
      expect(failures).toEqual([]);
    });
  }
});

async function upgradeRun({
  trigger,
  upgradeAtMs,
}: {
  trigger: 'ends' | 'time-before';
  upgradeAtMs: number;
}): Promise<UpgradeResult> {
  const enabledAtMs = DAY_START_MS - 20 * HOUR_MS;
  let lastPoll = enabledAtMs;
  const previous: string[] = [];
  for (let nowMs = enabledAtMs + PREVIOUS_POLL_MS; nowMs <= upgradeAtMs; nowMs += PREVIOUS_POLL_MS) {
    const items = trigger === 'ends'
      ? previousEndsItems({ lastPoll, nowMs })
      : previousTimeBeforeItems({ nowMs });
    previous.push(...items.filter((item) => item.epochMs > lastPoll).map((item) => item.id));
    lastPoll = items.reduce((max, item) => Math.max(max, item.epochMs), lastPoll);
  }
  const { store } = memoryStore();
  await store.put('lastPoll', lastPoll);
  vi.setSystemTime(upgradeAtMs);
  const props = trigger === 'ends' ? ENDS_PROPS : TIME_BEFORE_PROPS;
  const current: string[] = [];
  if (trigger === 'ends') {
    await eventEnds.onEnable(context({ store, props, isRepublish: true }));
  } else {
    await eventStartTimeBefore.onEnable(context({ store, props, isRepublish: true }));
  }
  for (let nowMs = upgradeAtMs + NEW_POLL_MS; nowMs <= DAY_START_MS + 40 * HOUR_MS; nowMs += NEW_POLL_MS) {
    vi.setSystemTime(nowMs);
    const out = trigger === 'ends'
      ? await eventEnds.run(context({ store, props }))
      : await eventStartTimeBefore.run(context({ store, props }));
    current.push(...idsOf(out));
  }
  const lostByPrevious = fakeCalendar.events
    .filter((event) => trueDueMs({ event, trigger }) <= upgradeAtMs && !previous.includes(event.id))
    .map((event) => event.id);
  return { previous, current, lostByPrevious, ids: fakeCalendar.events.map((event) => event.id) };
}

function previousEndsItems({ lastPoll, nowMs }: { lastPoll: number; nowMs: number }): PreviousItem[] {
  return fakeCalendar.events
    .filter((event) => googleTimeMs({ bound: event.end }) > lastPoll)
    .map((event) => ({ id: event.id, epochMs: Date.parse(String(event.end.dateTime ?? event.end.date)) }))
    .filter((item) => item.epochMs > lastPoll && item.epochMs <= nowMs);
}

function previousTimeBeforeItems({ nowMs }: { nowMs: number }): PreviousItem[] {
  const timeMinMs = nowMs + LEAD_MS;
  const timeMaxMs = nowMs + LEAD_MS + PREVIOUS_POLL_MS;
  return fakeCalendar.events
    .filter((event) => googleTimeMs({ bound: event.end }) > timeMinMs && googleTimeMs({ bound: event.start }) < timeMaxMs)
    .map((event) => ({ id: event.id, epochMs: Date.parse(String(event.start.dateTime ?? event.start.date)) - LEAD_MS }));
}

function trueDueMs({ event, trigger }: { event: FakeEvent; trigger: 'ends' | 'time-before' }): number {
  return trigger === 'ends'
    ? googleTimeMs({ bound: event.end })
    : googleTimeMs({ bound: event.start }) - LEAD_MS;
}

function countProblems({ hour, result }: { hour: number; result: UpgradeResult }): string[] {
  return result.ids.flatMap((id) => {
    const count = [...result.previous, ...result.current].filter((fired) => fired === id).length;
    if (count > 1) {
      return [`D${hour}h ${id} fired ${count} times`];
    }
    if (count === 0 && !result.lostByPrevious.includes(id)) {
      return [`D${hour}h ${id} never fired`];
    }
    return [];
  });
}

function context({
  store,
  props,
  isRepublish,
}: {
  store: Store;
  props: Record<string, unknown>;
  isRepublish?: boolean;
}): Parameters<typeof eventEnds.run>[0] & Parameters<typeof eventStartTimeBefore.run>[0] {
  return triggerContext({ value: { auth: fakeAuth, store, propsValue: props, isRepublish, files: {} } });
}

type PreviousItem = {
  id: string;
  epochMs: number;
};

type UpgradeResult = {
  previous: string[];
  current: string[];
  lostByPrevious: string[];
  ids: string[];
};
