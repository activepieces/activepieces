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
const STORE_LIMIT_BYTES = 512 * 1024;
const EVENT_COUNT = 30;
const ENABLED_AT_MS = Date.parse('2026-10-01T10:00:00Z');
const ENDS_PROPS = { calendar_id: 'primary', specific_event: false };
// A 2-hour lead keeps every reminder's meeting in the future while the dense
// listing is spread over several checks; reminders after the start are dropped.
const LEAD_MS = 2 * 60 * MINUTE_MS;
const TIME_BEFORE_PROPS = { calendar_id: 'primary', specific_event: false, time_value: 2, time_unit: 'hours' };

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
    const dueById = addDenseEvents({ anchor: 'start', leadMs: LEAD_MS });
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
    const dueById = addDenseEvents({ anchor: 'start', leadMs: LEAD_MS });
    const { fired } = await checkEveryFiveMinutes({ trigger: 'time-before', rejectTokenAtCheck: 2 });
    expectEachOnceNotEarly({ fired, dueById });
  });
});

describe('Event Start (Time Before) and Event Ends when one unfinished listing fires more than the seen limit', () => {
  it('Time Before fires each of 1,500 reminders once when the saved page is rejected after the seen list was cut', async () => {
    fakeCalendar.pageSize = 600;
    const dueById = addBurst({ anchor: 'start' });
    const { fired } = await checkEveryFiveMinutes({ trigger: 'time-before', rejectTokenAtCheck: 2 });
    expectEachOnceNotEarly({ fired, dueById });
  });

  it('Event Ends fires each of 1,500 ends once when the saved page is rejected after the seen list was cut, even when end order differs from start order', async () => {
    fakeCalendar.pageSize = 600;
    const dueById = addBurst({ anchor: 'end' });
    const { fired } = await checkEveryFiveMinutes({ trigger: 'ends', rejectTokenAtCheck: 2 });
    expectEachOnceNotEarly({ fired, dueById });
  });
});

function addBurst({ anchor }: { anchor: 'start' | 'end' }): Map<string, number> {
  const dueById = new Map<string, number>();
  for (let index = 0; index < 1500; index++) {
    const id = `burst-${index}`;
    if (anchor === 'start') {
      const startMs = Date.parse('2026-10-01T10:05:00Z') + LEAD_MS + index * 200;
      addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(startMs + 30 * MINUTE_MS).toISOString() });
      dueById.set(id, startMs - LEAD_MS);
      continue;
    }
    const startMs = Date.parse('2026-10-01T09:50:00Z') + index * 200;
    const endMs = startMs + (index < 1200 ? 15 : 7) * MINUTE_MS;
    addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
    dueById.set(id, endMs);
  }
  return dueById;
}

describe('Event Start (Time Before) and Event Ends stay under the 512 KB store limit with long event ids', () => {
  for (const trigger of ['time-before', 'ends'] as const) {
    it(`${trigger}: 1,500 reminders with 1,000-character ids in one window fire once each`, async () => {
      fakeCalendar.pageSize = 600;
      const dueById = addLongIdEvents({ trigger, count: 1500, spacingMs: 200 });
      const { fired } = await checkEveryFiveMinutes({ trigger, storeLimitBytes: STORE_LIMIT_BYTES });
      expectEachOnceNotEarly({ fired, dueById });
    });

    it(`${trigger}: 600 reminders with 1,000-character ids due in the minute before one finished check fire once each`, async () => {
      fakeCalendar.pageSize = 2500;
      const dueById = new Map<string, number>();
      for (let index = 0; index < 600; index++) {
        const id = `${'y'.repeat(990)}-${index}`;
        const dueMs = Date.parse('2026-10-01T10:09:00.050Z') + index * 99;
        const startMs = trigger === 'time-before' ? dueMs + LEAD_MS : dueMs - 3 * MINUTE_MS;
        const endMs = trigger === 'time-before' ? startMs + 30 * MINUTE_MS : dueMs;
        addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
        dueById.set(id, dueMs);
      }
      const { fired } = await checkEveryFiveMinutes({ trigger, storeLimitBytes: STORE_LIMIT_BYTES });
      expectEachOnceNotEarly({ fired, dueById });
    });

    it(`${trigger}: 1,200 reminders with the same start, 1,000-character ids and a due time in the minute before the listing started, then later ones, fire once each`, async () => {
      fakeCalendar.pageSize = 600;
      const dueById = new Map<string, number>();
      const dueMs = Date.parse('2026-10-01T10:09:30Z');
      const startMs = trigger === 'time-before' ? dueMs + LEAD_MS : dueMs - 3 * MINUTE_MS;
      const endMs = trigger === 'time-before' ? startMs + 30 * MINUTE_MS : dueMs;
      for (let index = 0; index < 1200; index++) {
        const id = `${'z'.repeat(990)}-${index}`;
        addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
        dueById.set(id, dueMs);
      }
      for (let index = 0; index < 300; index++) {
        const id = `later-${index}`;
        const laterStartMs = startMs + 30 * MINUTE_MS + index * 1000;
        const laterEndMs = laterStartMs + (trigger === 'time-before' ? 30 : 3) * MINUTE_MS;
        addTimedEvent({ id, start: new Date(laterStartMs).toISOString(), end: new Date(laterEndMs).toISOString() });
        dueById.set(id, trigger === 'time-before' ? laterStartMs - LEAD_MS : laterEndMs);
      }
      const { fired } = await checkEveryFiveMinutes({ trigger, storeLimitBytes: STORE_LIMIT_BYTES });
      expectEachOnceNotEarly({ fired, dueById });
    });

    it(`${trigger}: 3,000 reminders with the same start and 1,000-character ids fire once each`, async () => {
      fakeCalendar.pageSize = 600;
      const dueById = addLongIdEvents({ trigger, count: 3000, spacingMs: 0 });
      const { fired } = await checkEveryFiveMinutes({ trigger, storeLimitBytes: STORE_LIMIT_BYTES });
      expectEachOnceNotEarly({ fired, dueById });
    });
  }
});

function addLongIdEvents({
  trigger,
  count,
  spacingMs,
}: {
  trigger: 'time-before' | 'ends';
  count: number;
  spacingMs: number;
}): Map<string, number> {
  const dueById = new Map<string, number>();
  for (let index = 0; index < count; index++) {
    const id = `${'x'.repeat(990)}-${index}`;
    const startMs = (trigger === 'time-before' ? Date.parse('2026-10-01T10:05:00Z') + LEAD_MS : Date.parse('2026-10-01T10:00:30Z')) + index * spacingMs;
    const endMs = startMs + (trigger === 'time-before' ? 30 : 3) * MINUTE_MS;
    addTimedEvent({ id, start: new Date(startMs).toISOString(), end: new Date(endMs).toISOString() });
    dueById.set(id, trigger === 'time-before' ? startMs - LEAD_MS : endMs);
  }
  return dueById;
}

function sizeLimitedStore({ store, limitBytes }: { store: Store; limitBytes: number }): Store {
  return {
    get: store.get,
    delete: store.delete,
    put: async <T>(key: string, value: T): Promise<T> => {
      const bytes = Buffer.byteLength(JSON.stringify(value));
      if (bytes > limitBytes) {
        throw new Error(`StorageLimitError: ${key} is ${bytes} bytes`);
      }
      return store.put(key, value);
    },
  };
}

function addDenseEvents({ anchor, leadMs }: { anchor: 'start' | 'end'; leadMs: number }): Map<string, number> {
  const dueById = new Map<string, number>();
  for (let index = 0; index < EVENT_COUNT; index++) {
    const anchorMs = Date.parse('2026-10-01T10:20:00Z') + (anchor === 'start' ? leadMs - 15 * MINUTE_MS : 0) + index * 10_000;
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
  storeLimitBytes,
}: {
  trigger: 'time-before' | 'ends';
  rejectTokenAtCheck?: number;
  storeLimitBytes?: number;
}): Promise<{ fired: { id: string; atMs: number }[]; firstCheckPages: number }> {
  const store = sizeLimitedStore({ store: memoryStore().store, limitBytes: storeLimitBytes ?? Number.MAX_SAFE_INTEGER });
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
