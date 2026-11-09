import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventEnds } from '../src/lib/triggers/event-ends';
import { eventStartTimeBefore } from '../src/lib/triggers/event-start-time-before';
import {
  addTimedEvent,
  fakeAuth,
  fakeCalendar,
  idsOf,
  memoryStore,
  resetFakeCalendar,
  triggerContext,
} from './range-fake-google';

const MINUTE_MS = 60 * 1000;
const EVENT_COUNT = 30;
const ENABLED_AT_MS = Date.parse('2026-10-01T10:00:00Z');
const ENDS_PROPS = { calendar_id: 'primary', specific_event: false };
const TIME_BEFORE_PROPS = { calendar_id: 'primary', specific_event: false, time_value: 15, time_unit: 'minutes' };

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  resetFakeCalendar();
  fakeCalendar.pageSize = 2;
  fakeCalendar.listDelayMs = 8_000;
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Start (Time Before) and Event Ends on a calendar too dense to list in one check', () => {
  it('Time Before continues from the saved page on later checks and fires every reminder once, never early', async () => {
    const dueById = addDenseEvents({ anchor: 'start', leadMs: 15 * MINUTE_MS });
    const { fired, firstCheckPages } = await checkEveryFiveMinutes({ trigger: 'time-before' });
    expectEachOnceNotEarly({ fired, dueById });
    expect(firstCheckPages).toBe(2);
  });

  it('Event Ends continues from the saved page on later checks and fires every end once, never early', async () => {
    const dueById = addDenseEvents({ anchor: 'end', leadMs: 0 });
    const { fired, firstCheckPages } = await checkEveryFiveMinutes({ trigger: 'ends' });
    expectEachOnceNotEarly({ fired, dueById });
    expect(firstCheckPages).toBe(2);
  });

  it('starts the same window again when Google rejects the saved page position, without firing anything twice', async () => {
    const dueById = addDenseEvents({ anchor: 'start', leadMs: 15 * MINUTE_MS });
    const { fired } = await checkEveryFiveMinutes({ trigger: 'time-before', rejectTokenAtCheck: 2 });
    expectEachOnceNotEarly({ fired, dueById });
  });
});

function addDenseEvents({ anchor, leadMs }: { anchor: 'start' | 'end'; leadMs: number }): Map<string, number> {
  const dueById = new Map<string, number>();
  for (let index = 0; index < EVENT_COUNT; index++) {
    const anchorMs = Date.parse('2026-10-01T10:20:00Z') + index * 10_000;
    const startMs = anchor === 'start' ? anchorMs : anchorMs - 15 * MINUTE_MS;
    const endMs = anchor === 'start' ? anchorMs + 30 * MINUTE_MS : anchorMs;
    const id = `dense-${index}`;
    addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
    dueById.set(id, anchorMs - leadMs);
  }
  return dueById;
}

async function checkEveryFiveMinutes({
  trigger,
  rejectTokenAtCheck,
}: {
  trigger: 'time-before' | 'ends';
  rejectTokenAtCheck?: number;
}): Promise<{ fired: { id: string; atMs: number }[]; firstCheckPages: number }> {
  const { store } = memoryStore();
  const props = trigger === 'ends' ? ENDS_PROPS : TIME_BEFORE_PROPS;
  vi.setSystemTime(ENABLED_AT_MS);
  await enable({ trigger, store, props });
  const fired: { id: string; atMs: number }[] = [];
  let firstCheckPages = 0;
  for (let check = 1; check <= 30; check++) {
    const atMs = ENABLED_AT_MS + (check + 1) * 5 * MINUTE_MS;
    fakeCalendar.rejectNextPageToken = check === rejectTokenAtCheck;
    vi.setSystemTime(atMs);
    const out = await run({ trigger, store, props });
    fired.push(...idsOf(out).map((id) => ({ id, atMs })));
    if (check === 1) {
      firstCheckPages = fakeCalendar.requests.length;
    }
  }
  return { fired, firstCheckPages };
}

function expectEachOnceNotEarly({
  fired,
  dueById,
}: {
  fired: { id: string; atMs: number }[];
  dueById: Map<string, number>;
}): void {
  expect(fired.map((entry) => entry.id).sort()).toEqual([...dueById.keys()].sort());
  const early = fired.filter((entry) => entry.atMs < (dueById.get(entry.id) ?? 0));
  expect(early).toEqual([]);
}

async function enable({ trigger, store, props }: { trigger: 'time-before' | 'ends'; store: Store; props: Record<string, unknown> }): Promise<void> {
  if (trigger === 'ends') {
    await eventEnds.onEnable(context({ store, props }));
    return;
  }
  await eventStartTimeBefore.onEnable(context({ store, props }));
}

async function run({ trigger, store, props }: { trigger: 'time-before' | 'ends'; store: Store; props: Record<string, unknown> }): Promise<unknown[]> {
  return trigger === 'ends'
    ? eventEnds.run(context({ store, props }))
    : eventStartTimeBefore.run(context({ store, props }));
}

function context({
  store,
  props,
}: {
  store: Store;
  props: Record<string, unknown>;
}): Parameters<typeof eventEnds.run>[0] & Parameters<typeof eventStartTimeBefore.run>[0] {
  return triggerContext({ value: { auth: fakeAuth, store, propsValue: props, files: {} } });
}
