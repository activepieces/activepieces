import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventCancelled as trigger } from '../src/lib/triggers/event-cancelled';

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const CHECKPOINT_KEY = 'event_cancelled_checkpoint';

const vendor: FakeVendorState = {
  events: new Map<string, VendorEvent>(),
  requests: [],
  latencyMs: 0,
  failures: [],
  goneAfterDays: 0,
  getFailure: undefined,
};

let clock = Date.parse('2026-11-01T10:00:00.000Z');

beforeEach(() => {
  vendor.events.clear();
  vendor.requests = [];
  vendor.latencyMs = 0;
  vendor.failures = [];
  vendor.goneAfterDays = 0;
  vendor.getFailure = undefined;
  clock = Date.parse('2026-11-01T10:00:00.000Z');
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(clock);
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeVendor, undefined, [request]));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Event Cancelled behaviour: whole calendar', () => {
  it('fires once for a deleted series, once for one cancelled occurrence, and never again', async () => {
    createSeries({ id: 'weekly', occurrences: 12 });
    createSeries({ id: 'daily', occurrences: 30 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);

    deleteSeries({ id: 'weekly' });
    cancelOccurrence({ seriesId: 'daily', index: 4 });

    expect(await poll({ store })).toEqual(['weekly', 'daily_4']);
    expect(await quickPoll({ store, seconds: 10 })).toEqual([]);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire again for a cancellation listed again inside the visibility margin', async () => {
    createEvent({ id: 'quick' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    deleteEvent({ id: 'quick' });

    expect(await quickPoll({ store, seconds: 20 })).toEqual(['quick']);
    expect(await quickPoll({ store, seconds: 20 })).toEqual([]);
    expect(vendor.requests[vendor.requests.length - 1]['updatedMin'] <= eventById({ id: 'quick' }).updated).toBe(true);
  });

  it('fires once for a deleted series that has a moved occurrence', async () => {
    createSeries({ id: 'weekly', occurrences: 12 });
    moveOccurrence({ seriesId: 'weekly', index: 2 });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    deleteSeries({ id: 'weekly' });

    expect(await poll({ store })).toEqual(['weekly']);
    expect(await poll({ store })).toEqual([]);
  });

  it('does not fire for edits, or for cancellations that happened before it was turned on', async () => {
    createEvent({ id: 'gone-before' });
    deleteEvent({ id: 'gone-before' });
    createEvent({ id: 'live' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'live' });
    expect(await poll({ store })).toEqual([]);
  });

  it('keeps up through 20 quiet days of edits and fires a later cancellation once without a warning', async () => {
    vendor.goneAfterDays = 20;
    createEvent({ id: 'busy' });
    createEvent({ id: 'doomed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const enabledAt = clock;
    while (clock < enabledAt + 21 * DAY) {
      editEvent({ id: 'busy' });
      tick(60);
      expect(await poll({ store })).toEqual([]);
    }

    deleteEvent({ id: 'doomed' });
    expect(await poll({ store })).toEqual(['doomed']);
    expect(await poll({ store })).toEqual([]);
    expect(warn).not.toHaveBeenCalled();
  });

  it('re-baselines and logs when a switched-off flow is older than Google accepts', async () => {
    vendor.goneAfterDays = 20;
    createEvent({ id: 'during-gap' });
    createEvent({ id: 'after-gap' });
    const { store, data } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    clock += 30 * DAY;
    deleteEvent({ id: 'during-gap' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    expect(await poll({ store })).toEqual([]);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));
    expect(checkpointOf({ data }).scannedThroughMs).toBe(clock + 1);

    deleteEvent({ id: 'after-gap' });
    expect(await poll({ store })).toEqual(['after-gap']);
    expect(await poll({ store })).toEqual([]);
  });

  it('stops paging before the listing budget and fires the rest on the next poll, each once', async () => {
    for (let index = 0; index < 3000; index++) {
      createEvent({ id: `bulk-${index}`, at: clock - 30 * DAY });
    }
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    tick(1);
    Array.from(vendor.events.values()).forEach((event, index) => {
      event.status = 'cancelled';
      event.updated = new Date(clock + index).toISOString();
    });
    clock += 3000;
    vendor.latencyMs = 16_000;
    tick(5);

    const startedAt = clock;
    const first = (await trigger.run(hookContext({ store }))).map(idOf);
    expect(clock - startedAt).toBeLessThan(25_000);
    vendor.latencyMs = 0;
    const second = await poll({ store });
    const third = await poll({ store });

    expect(first).toHaveLength(2500);
    expect(second).toHaveLength(500);
    expect(new Set([...first, ...second]).size).toBe(3000);
    expect(third).toEqual([]);
  });

  it('throws when the list fails and fires the cancellation on the next poll', async () => {
    createEvent({ id: 'doomed' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    deleteEvent({ id: 'doomed' });
    vendor.failures = [503];
    tick(5);
    await expect(trigger.run(hookContext({ store }))).rejects.toThrow();
    expect(await poll({ store })).toEqual(['doomed']);
  });

  it('keeps its position across a republish, and starts from now on a plain re-enable', async () => {
    createEvent({ id: 'a' });
    createEvent({ id: 'b' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    deleteEvent({ id: 'a' });
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(await poll({ store })).toEqual(['a']);

    deleteEvent({ id: 'b' });
    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));
    expect(await poll({ store })).toEqual([]);
  });

  it('continues from the lastPoll saved by the previous version on republish', async () => {
    createEvent({ id: 'fired-before' });
    createEvent({ id: 'missed' });
    const { store, data } = memoryStore();
    deleteEvent({ id: 'fired-before' });
    data.set('lastPoll', JSON.stringify(Date.parse(eventById({ id: 'fired-before' }).updated ?? '')));
    deleteEvent({ id: 'missed' });

    await trigger.onEnable(hookContext({ store, isRepublish: true }));

    expect(await poll({ store })).toEqual(['missed']);
    expect(await poll({ store })).toEqual([]);
  });

  it('resumes at most 24 hours back from an old lastPoll of the previous version and logs the skipped part', async () => {
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    createEvent({ id: 'cancelled-weeks-ago' });
    deleteEvent({ id: 'cancelled-weeks-ago' });
    tick(20 * 24 * 60);
    createEvent({ id: 'cancelled-today' });
    deleteEvent({ id: 'cancelled-today' });
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('were skipped and will not fire'));

    expect(await poll({ store })).toEqual(['cancelled-today']);
    expect(await poll({ store })).toEqual([]);
  });

  it('asks Google for deleted items without expanding recurring events', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    await poll({ store });
    expect(vendor.requests[0]['showDeleted']).toBe('true');
    expect(vendor.requests[0]['singleEvents']).toBe('false');
  });

  it('puts every cancellation under exactly one reason', async () => {
    const cases: { reasons: string[]; expected: string[] }[] = [
      { reasons: ['rescheduled'], expected: ['moved'] },
      { reasons: ['declined'], expected: ['declined'] },
      { reasons: ['deleted'], expected: ['mine', 'bare'] },
      { reasons: ['other'], expected: ['theirs'] },
      { reasons: ['deleted', 'other'], expected: ['mine', 'bare', 'theirs'] },
      { reasons: [], expected: ['moved', 'declined', 'mine', 'bare', 'theirs'] },
    ];
    for (const { reasons, expected } of cases) {
      vendor.events.clear();
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store, reasons }));
      addCancelled({ id: 'moved', summary: 'Dentist', description: '  RESCHEDULED to Friday', organizerSelf: true, declined: true });
      addCancelled({ id: 'declined', summary: 'Sync', organizerSelf: true, declined: true });
      addCancelled({ id: 'mine', summary: 'Q3 Planning', organizerSelf: true });
      addCancelled({ id: 'bare' });
      addCancelled({ id: 'theirs', summary: 'Vendor call', organizerSelf: false });
      expect(await poll({ store, reasons })).toEqual(expected);
    }
  });

  it('test() returns a cancellation from three days ago, newest first, cancelled only', async () => {
    createEvent({ id: 'old-cancel', at: clock - 3 * DAY, status: 'cancelled' });
    createEvent({ id: 'new-cancel', at: clock - DAY / 2, status: 'cancelled' });
    createEvent({ id: 'live', at: clock - DAY });
    const { store } = memoryStore();

    const sample = await trigger.test(hookContext({ store }));

    expect(sample.map(idOf)).toEqual(['new-cancel', 'old-cancel']);
  });
});

describe('Event Cancelled behaviour: one specific event', () => {
  it('fires once when the event is cancelled, with or without updated, and once more after a restore and re-cancel', async () => {
    createEvent({ id: 'pinned' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, pinned: 'pinned' }));
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);

    deleteEvent({ id: 'pinned' });
    eventById({ id: 'pinned' }).updated = undefined;
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);

    eventById({ id: 'pinned' }).status = 'confirmed';
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
    deleteEvent({ id: 'pinned' });
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
  });

  it('does not fire for an event that was already cancelled when it was turned on', async () => {
    createEvent({ id: 'pinned' });
    deleteEvent({ id: 'pinned' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, pinned: 'pinned' }));
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
  });

  it('fires once when Google answers 404 for the event', async () => {
    createEvent({ id: 'pinned' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, pinned: 'pinned' }));
    vendor.events.delete('pinned');
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
  });

  it('throws on a server error and fires the cancellation on the next poll', async () => {
    createEvent({ id: 'pinned' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store, pinned: 'pinned' }));
    deleteEvent({ id: 'pinned' });
    vendor.getFailure = 503;
    tick(5);
    await expect(trigger.run(hookContext({ store, pinned: 'pinned' }))).rejects.toThrow();
    vendor.getFailure = undefined;
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
  });

  it('turns on when the event cannot be read, fails the check while Google rejects it, then records the status without firing', async () => {
    createEvent({ id: 'pinned' });
    const { store } = memoryStore();
    vendor.getFailure = 503;
    await trigger.onEnable(hookContext({ store, pinned: 'pinned' }));
    await expect(poll({ store, pinned: 'pinned' })).rejects.toThrow();

    vendor.getFailure = undefined;
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
    deleteEvent({ id: 'pinned' });
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
  });

  it('refuses to turn on when Target Specific Event has no event', async () => {
    const { store } = memoryStore();
    await expect(trigger.onEnable(hookContext({ store, pinned: '' }))).rejects.toThrow('Select the event to watch');
  });

  it('fires a cancellation that happened after the last check of the previous version', async () => {
    createEvent({ id: 'pinned' });
    const { store, data } = memoryStore();
    data.set('lastPoll', JSON.stringify(clock));
    deleteEvent({ id: 'pinned' });
    await trigger.onEnable(hookContext({ store, pinned: 'pinned', isRepublish: true }));
    expect(await poll({ store, pinned: 'pinned' })).toEqual(['pinned']);
    expect(await poll({ store, pinned: 'pinned' })).toEqual([]);
  });
});

function tick(minutes: number): void {
  clock += minutes * MINUTE;
  vi.setSystemTime(clock);
}

function nowIso(): string {
  return new Date(clock).toISOString();
}

function createEvent({ id, at, status }: { id: string; at?: number; status?: string }): void {
  tick(1);
  const time = new Date(at ?? clock).toISOString();
  vendor.events.set(id, baseEvent({ id, created: time, updated: time, status }));
}

function addCancelled({ id, summary, description, organizerSelf, declined }: { id: string; summary?: string; description?: string; organizerSelf?: boolean; declined?: boolean }): void {
  tick(1);
  const time = nowIso();
  vendor.events.set(id, {
    kind: 'calendar#event',
    id,
    status: 'cancelled',
    updated: time,
    ...(summary === undefined ? {} : { summary, created: time }),
    ...(description === undefined ? {} : { description }),
    ...(organizerSelf === undefined ? {} : { organizer: { email: organizerSelf ? 'me@example.com' : 'boss@other.example.com', self: organizerSelf } }),
    ...(declined ? { attendees: [{ email: 'guest@example.com', responseStatus: 'declined' }] } : {}),
  });
}

function createSeries({ id, occurrences }: { id: string; occurrences: number }): void {
  tick(1);
  const time = nowIso();
  vendor.events.set(id, { ...baseEvent({ id, created: time, updated: time }), recurrence: ['RRULE:FREQ=WEEKLY'] });
  for (let index = 0; index < occurrences; index++) {
    const instanceId = `${id}_${index}`;
    vendor.events.set(instanceId, { ...baseEvent({ id: instanceId, created: time, updated: time }), recurringEventId: id, expandedInstance: true });
  }
}

function deleteSeries({ id }: { id: string }): void {
  tick(1);
  vendor.events.forEach((event) => {
    if (event.id === id || event.recurringEventId === id) {
      event.status = 'cancelled';
      event.updated = nowIso();
    }
  });
}

function cancelOccurrence({ seriesId, index }: { seriesId: string; index: number }): void {
  tick(1);
  const instance = eventById({ id: `${seriesId}_${index}` });
  instance.status = 'cancelled';
  instance.updated = nowIso();
  instance.expandedInstance = false;
}

function moveOccurrence({ seriesId, index }: { seriesId: string; index: number }): void {
  tick(1);
  const instance = eventById({ id: `${seriesId}_${index}` });
  instance.updated = nowIso();
  instance.expandedInstance = false;
}

function editEvent({ id }: { id: string }): void {
  tick(1);
  eventById({ id }).updated = nowIso();
}

function deleteEvent({ id }: { id: string }): void {
  tick(1);
  const event = eventById({ id });
  event.status = 'cancelled';
  event.updated = nowIso();
}

function eventById({ id }: { id: string }): VendorEvent {
  const event = vendor.events.get(id);
  if (!event) {
    throw new Error(`no event ${id}`);
  }
  return event;
}

function baseEvent({ id, created, updated, status }: { id: string; created: string; updated: string; status?: string }): VendorEvent {
  return {
    kind: 'calendar#event',
    id,
    status: status ?? 'confirmed',
    summary: `Event ${id}`,
    created,
    updated,
    organizer: { email: 'me@example.com', self: true },
  };
}

function checkpointOf({ data }: { data: Map<string, string> }): { scannedThroughMs: number } {
  const raw = data.get(CHECKPOINT_KEY);
  const parsed: unknown = raw === undefined ? null : JSON.parse(raw);
  if (typeof parsed === 'object' && parsed !== null && 'scannedThroughMs' in parsed && typeof parsed.scannedThroughMs === 'number') {
    return { scannedThroughMs: parsed.scannedThroughMs };
  }
  throw new Error('no checkpoint');
}

async function fakeVendor(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  if (vendor.latencyMs > 0) {
    clock += vendor.latencyMs;
    vi.setSystemTime(clock);
  }
  const getMatch = /\/events\/([^/?]+)$/.exec(request.url);
  if (getMatch) {
    return getEvent({ request, id: decodeURIComponent(getMatch[1]) });
  }
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  vendor.requests.push(params);
  const updatedMin = params['updatedMin'];
  const tooOld = vendor.goneAfterDays > 0 && updatedMin !== undefined && Date.parse(updatedMin) < clock - vendor.goneAfterDays * DAY;
  const failure = tooOld ? 410 : vendor.failures.shift();
  if (failure !== undefined && failure !== 0) {
    throw new HttpError(request.body, { status: failure, responseBody: { error: { code: failure } } });
  }
  return { status: 200, headers: {}, body: listEvents({ params }) };
}

function getEvent({ request, id }: { request: HttpRequest; id: string }): { status: number; headers: Record<string, string>; body: unknown } {
  if (vendor.getFailure !== undefined) {
    throw new HttpError(request.body, { status: vendor.getFailure, responseBody: { error: { code: vendor.getFailure } } });
  }
  const event = vendor.events.get(id);
  if (!event) {
    throw new HttpError(request.body, { status: 404, responseBody: { error: { code: 404 } } });
  }
  const { expandedInstance: _expanded, ...rest } = event;
  return { status: 200, headers: {}, body: event.status === 'cancelled' ? { kind: rest.kind, id: rest.id, status: rest.status, ...(rest.updated ? { updated: rest.updated } : {}) } : rest };
}

function listEvents({ params }: { params: Record<string, string> }): { items: VendorEvent[]; nextPageToken?: string } {
  const expand = params['singleEvents'] === 'true';
  const updatedMin = params['updatedMin'] ? Date.parse(params['updatedMin']) : 0;
  const visible = Array.from(vendor.events.values())
    .filter((event) => (expand ? !event.recurrence : !event.expandedInstance))
    .filter((event) => Date.parse(event.updated ?? '') >= updatedMin)
    .filter((event) => event.status !== 'cancelled' || params['showDeleted'] === 'true' || params['updatedMin'] !== undefined)
    .sort((left, right) => Date.parse(left.updated ?? '') - Date.parse(right.updated ?? ''));
  const pageSize = Math.min(Number(params['maxResults'] ?? '250'), 2500);
  const offset = Number(params['pageToken'] ?? '0');
  const page = visible.slice(offset, offset + pageSize).map(({ expandedInstance: _expanded, ...event }) => event);
  return offset + pageSize < visible.length ? { items: page, nextPageToken: String(offset + pageSize) } : { items: page };
}

async function quickPoll({ store, seconds }: { store: Store; seconds: number }): Promise<string[]> {
  clock += seconds * 1000;
  vi.setSystemTime(clock);
  return (await trigger.run(hookContext({ store }))).map(idOf);
}

async function poll({ store, reasons, pinned }: { store: Store; reasons?: string[]; pinned?: string }): Promise<string[]> {
  tick(5);
  return (await trigger.run(hookContext({ store, reasons, pinned }))).map(idOf);
}

function idOf(item: unknown): string {
  return typeof item === 'object' && item !== null && 'id' in item ? String(item.id) : '';
}

function memoryStore(): { store: Store; data: Map<string, string> } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string): Promise<void> {
      data.delete(key);
    },
  };
  return { store, data };
}

function hookContext({ store, isRepublish, reasons, pinned }: { store: Store; isRepublish?: boolean; reasons?: string[]; pinned?: string }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, isRepublish, reasons, pinned }]);
}

function fakeContext({ store, isRepublish, reasons, pinned }: { store: Store; isRepublish?: boolean; reasons?: string[]; pinned?: string }) {
  return {
    store,
    isRepublish,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: {
      calendar_id: 'primary',
      specific_event: pinned !== undefined,
      event_id: pinned,
      cancellation_reason: reasons,
    },
    files: {},
  };
}

type FakeVendorState = {
  events: Map<string, VendorEvent>;
  requests: Record<string, string>[];
  latencyMs: number;
  failures: number[];
  goneAfterDays: number;
  getFailure: number | undefined;
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary?: string;
  description?: string;
  created?: string;
  updated?: string;
  organizer?: { email: string; self: boolean };
  attendees?: { email: string; responseStatus: string }[];
  recurrence?: string[];
  recurringEventId?: string;
  expandedInstance?: boolean;
};
