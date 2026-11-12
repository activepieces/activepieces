import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, DEDUPE_KEY_PROPERTY, Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent as trigger } from '../src/lib/triggers/new-event';

const WATCH_KEY = 'google_calendar_watch';

const google: FakeGoogleState = {
  version: 0,
  changes: [],
  channels: new Map<string, { id: string; active: boolean }>(),
  failFullSyncCalls: 0,
  failStopCalls: 0,
};

beforeEach(() => {
  google.version = 0;
  google.changes = [];
  google.channels.clear();
  google.failFullSyncCalls = 0;
  google.failStopCalls = 0;
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => Reflect.apply(fakeGoogle, undefined, [request]));
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Event behaviour', () => {
  it('fires once per new event across pushes and ignores sync and empty pushes', async () => {
    createEvent({ id: 'existing' });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    expect(await trigger.run(hookContext({ store, headers: { 'x-goog-resource-state': 'sync', 'x-goog-channel-id': liveChannelIds()[0] } }))).toEqual([]);
    expect(await pushFromEveryChannel({ store })).toEqual([]);

    createEvent({ id: 'booking' });
    const fired = await trigger.run(hookContext({ store, headers: pushHeaders({ channelId: liveChannelIds()[0] }) }));
    expect(fired.map(idOf)).toEqual(['booking']);
    expect(fired[0]).toHaveProperty(DEDUPE_KEY_PROPERTY, 'booking');

    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires nothing for old events after a republish and once for the next new event', async () => {
    const { store } = memoryStore();
    createEvent({ id: 'before' });
    await trigger.onEnable(hookContext({ store }));

    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));
    expect(liveChannelIds()).toHaveLength(1);
    expect(await pushFromEveryChannel({ store })).toEqual([]);

    createEvent({ id: 'after' });
    expect(await pushFromEveryChannel({ store })).toEqual(['after']);
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('delivers, once, events created before and during a republish (PIE-1140)', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'queued-before-publish' });
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    createEvent({ id: 'during-publish' });
    await trigger.onEnable(hookContext({ store, isRepublish: true }));
    expect(liveChannelIds()).toHaveLength(1);
    expect((await pushFromEveryChannel({ store })).sort()).toEqual(['during-publish', 'queued-before-publish']);
    createEvent({ id: 'after-publish' });
    expect(await pushFromEveryChannel({ store })).toEqual(['after-publish']);
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('starts fresh on a republish that switches calendar', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'on-old-calendar' });
    await trigger.onDisable(hookContext({ store, isRepublish: true }));
    await trigger.onEnable(hookContext({ store, isRepublish: true, calendarId: 'team@example.com' }));
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire when a meeting that existed before enabling is rescheduled or renamed', async () => {
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    createEvent({ id: 'existing', createdAt: monthAgo });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'existing', changes: { start: { dateTime: '2026-11-21T10:00:00Z' } } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    editEvent({ id: 'existing', changes: { summary: 'Renamed meeting' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire when one occurrence of an older recurring meeting is moved', async () => {
    const twoMonthsAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();
    createEvent({ id: 'weekly', createdAt: twoMonthsAgo, extra: { recurrence: ['RRULE:FREQ=WEEKLY'] } });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({
      id: 'weekly_20261123T100000Z',
      createdAt: twoMonthsAgo,
      extra: { recurringEventId: 'weekly', originalStartTime: { dateTime: '2026-11-23T10:00:00Z' }, start: { dateTime: '2026-11-24T10:00:00Z' } },
    });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires a new recurring series once and a new meeting once even when it is edited later', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({ id: 'new-series', extra: { recurrence: ['RRULE:FREQ=DAILY'] } });
    createEvent({ id: 'new-meeting' });
    expect((await pushFromEveryChannel({ store })).sort()).toEqual(['new-meeting', 'new-series']);

    editEvent({ id: 'new-meeting', changes: { summary: 'Agenda added' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    editEvent({ id: 'new-series', changes: { summary: 'Series renamed' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires once when you are invited after turn-on to a meeting the organizer created earlier', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({ id: 'old-meeting', createdAt: daysAgo({ days: 30 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    expect(await pushFromEveryChannel({ store })).toEqual(['old-meeting']);
    editEvent({ id: 'old-meeting', changes: { summary: 'Agenda changed by organizer' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    editEvent({ id: 'old-meeting', changes: inviteFields({ responseStatus: 'accepted' }) });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    editEvent({ id: 'old-meeting', changes: { start: { dateTime: '2026-11-22T10:00:00Z' } } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires once for an invitation to one occurrence of a series whose master is not on the calendar', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({
      id: 'daily-standup_20261114T090000Z',
      createdAt: daysAgo({ days: 60 }),
      extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'daily-standup', originalStartTime: { dateTime: '2026-11-14T09:00:00Z' } },
    });
    expect(await pushFromEveryChannel({ store })).toEqual(['daily-standup_20261114T090000Z']);
    editEvent({ id: 'daily-standup_20261114T090000Z', changes: { summary: 'Standup moved' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire for an unanswered invitation that already existed at turn-on', async () => {
    createEvent({ id: 'waiting', createdAt: daysAgo({ days: 10 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    createEvent({ id: 'booking' });
    expect(await pushFromEveryChannel({ store })).toEqual(['booking']);
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire a moved occurrence of a series invitation that already fired', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'weekly-sync', createdAt: daysAgo({ days: 5 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurrence: ['RRULE:FREQ=WEEKLY'] } });
    expect(await pushFromEveryChannel({ store })).toEqual(['weekly-sync']);

    createEvent({
      id: 'weekly-sync_20261120T100000Z',
      createdAt: daysAgo({ days: 5 }),
      extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'weekly-sync' },
    });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire an invitation again after the own-event seen cap cuts', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'invite', createdAt: daysAgo({ days: 30 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    expect(await pushFromEveryChannel({ store })).toEqual(['invite']);

    Array.from({ length: 520 }, (_, index) => `booking-${index}`).forEach((id) => createEvent({ id }));
    expect(await pushFromEveryChannel({ store })).toHaveLength(520);

    editEvent({ id: 'invite', changes: { summary: 'Organizer edit' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('never fires an invitation again once the invitation cap drops it', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    Array.from({ length: 510 }, (_, index) => `invite-${index}`).forEach((id, index) =>
      createEvent({ id, createdAt: daysAgo({ days: 600 - index }), extra: inviteFields({ responseStatus: 'needsAction' }) })
    );
    expect(await pushFromEveryChannel({ store })).toHaveLength(510);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unanswered invitations'));

    editEvent({ id: 'invite-0', changes: { summary: 'Organizer edit' } });
    editEvent({ id: 'invite-495', changes: { summary: 'Organizer edit' } });
    editEvent({ id: 'invite-509', changes: { summary: 'Organizer edit' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire an invitation again after a republish when the organizer edits it', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'old-meeting', createdAt: daysAgo({ days: 30 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    expect(await pushFromEveryChannel({ store })).toEqual(['old-meeting']);

    await trigger.onDisable(hookContext({ store }));
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'old-meeting', changes: { summary: 'Organizer edit after republish' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('treats your own meeting with guests as an own event, never as an invitation', async () => {
    createEvent({ id: 'own-older', createdAt: daysAgo({ days: 20 }), extra: ownWithGuestsFields() });
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));

    editEvent({ id: 'own-older', changes: { summary: 'Rescheduled by me' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);

    createEvent({ id: 'own-new', extra: ownWithGuestsFields() });
    expect(await pushFromEveryChannel({ store })).toEqual(['own-new']);
    editEvent({ id: 'own-new', changes: { summary: 'Agenda added by me' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires a series invitation once when one of its occurrences is listed before the series itself', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({
      id: 'weekly-sync_20261120T100000Z',
      createdAt: daysAgo({ days: 5 }),
      extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'weekly-sync' },
    });
    createEvent({ id: 'weekly-sync', createdAt: daysAgo({ days: 5 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurrence: ['RRULE:FREQ=WEEKLY'] } });

    expect(await pushFromEveryChannel({ store })).toEqual(['weekly-sync']);
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires a series invitation once when one occurrence arrives in an earlier push than the series', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({
      id: 'weekly-sync_20261120T100000Z',
      createdAt: daysAgo({ days: 5 }),
      extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'weekly-sync' },
    });
    expect(await pushFromEveryChannel({ store })).toEqual(['weekly-sync_20261120T100000Z']);

    createEvent({ id: 'weekly-sync', createdAt: daysAgo({ days: 5 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurrence: ['RRULE:FREQ=WEEKLY'] } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('does not fire an invitation that is already accepted or declined when first seen', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'accepted-invite', createdAt: daysAgo({ days: 3 }), extra: inviteFields({ responseStatus: 'accepted' }) });
    createEvent({ id: 'declined-invite', createdAt: daysAgo({ days: 3 }), extra: inviteFields({ responseStatus: 'declined' }) });

    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('fires a separate invitation to another occurrence of the same series once', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'ser_20261114T090000Z', createdAt: daysAgo({ days: 30 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'ser' } });
    expect(await pushFromEveryChannel({ store })).toEqual(['ser_20261114T090000Z']);

    createEvent({ id: 'ser_20261121T090000Z', createdAt: daysAgo({ days: 30 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'ser' } });
    expect(await pushFromEveryChannel({ store })).toEqual(['ser_20261121T090000Z']);
    editEvent({ id: 'ser_20261121T090000Z', changes: { summary: 'Organizer edit' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('blocks moved occurrences once the whole series arrives after one of its occurrences fired', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'ser_20261114T090000Z', createdAt: daysAgo({ days: 30 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'ser' } });
    expect(await pushFromEveryChannel({ store })).toEqual(['ser_20261114T090000Z']);

    createEvent({ id: 'ser', createdAt: daysAgo({ days: 30 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurrence: ['RRULE:FREQ=WEEKLY'] } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
    createEvent({ id: 'ser_20261128T090000Z', createdAt: daysAgo({ days: 30 }), extra: { ...inviteFields({ responseStatus: 'needsAction' }), recurringEventId: 'ser' } });
    expect(await pushFromEveryChannel({ store })).toEqual([]);
  });

  it('forgets an invitation once it is answered so it does not count toward the cap', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    createEvent({ id: 'answered', createdAt: daysAgo({ days: 900 }), extra: inviteFields({ responseStatus: 'needsAction' }) });
    expect(await pushFromEveryChannel({ store })).toEqual(['answered']);
    editEvent({ id: 'answered', changes: inviteFields({ responseStatus: 'accepted' }) });
    expect(await pushFromEveryChannel({ store })).toEqual([]);

    Array.from({ length: 500 }, (_, index) => `open-${index}`).forEach((id, index) =>
      createEvent({ id, createdAt: daysAgo({ days: 600 - index }), extra: inviteFields({ responseStatus: 'needsAction' }) })
    );
    expect(await pushFromEveryChannel({ store })).toHaveLength(500);
    expect(warn).not.toHaveBeenCalledWith(expect.stringContaining('unanswered invitations'));
  });

  it('starts one run when two pushes for the same change are handled at the same time', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    createEvent({ id: 'booking' });
    const channelId = liveChannelIds()[0];

    const outputs = await Promise.all([
      trigger.run(hookContext({ store, headers: pushHeaders({ channelId }) })),
      trigger.run(hookContext({ store, headers: pushHeaders({ channelId }) })),
    ]);

    expect(serverDedupe({ flowVersionId: 'fv-1', outputs }).map(idOf)).toEqual(['booking']);
  });

  it('leaves no channel behind when the first full sync fails and the user retries', async () => {
    const { store } = memoryStore();
    google.failFullSyncCalls = 1;

    await expect(trigger.onEnable(hookContext({ store }))).rejects.toBeDefined();
    expect(liveChannelIds()).toEqual([]);

    await trigger.onEnable(hookContext({ store }));
    expect(liveChannelIds()).toEqual([storedWatchId({ store })]);

    createEvent({ id: 'booking' });
    expect(await pushFromEveryChannel({ store })).toEqual(['booking']);

    await trigger.onDisable(hookContext({ store }));
    expect(liveChannelIds()).toEqual([]);
  });

  it('stops the new channel and rethrows when saving it fails', async () => {
    const { store } = memoryStore();
    const failingStore: Store = {
      ...store,
      put: async () => {
        throw new Error('store unavailable');
      },
    };

    await expect(trigger.onEnable(hookContext({ store: failingStore }))).rejects.toThrow('store unavailable');
    expect(liveChannelIds()).toEqual([]);
  });

  it('ignores a push from a channel that leaked when its stop failed, without consuming the change', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const leaked = liveChannelIds()[0];
    google.failStopCalls = 1;
    await trigger.onDisable(hookContext({ store })).catch(() => undefined);
    await trigger.onEnable(hookContext({ store }));
    const registered = storedWatchId({ store });
    expect(liveChannelIds()).toEqual([leaked, registered]);

    createEvent({ id: 'booking' });
    expect(await trigger.run(hookContext({ store, headers: pushHeaders({ channelId: leaked }) }))).toEqual([]);
    expect((await trigger.run(hookContext({ store, headers: pushHeaders({ channelId: registered }) }))).map(idOf)).toEqual(['booking']);
  });
});

function createEvent({ id, createdAt, extra }: { id: string; createdAt?: string; extra?: Partial<VendorEvent> }): void {
  google.version += 1;
  const now = new Date().toISOString();
  google.changes.push({
    version: google.version,
    event: {
      kind: 'calendar#event',
      id,
      status: 'confirmed',
      summary: `Meeting ${id}`,
      created: createdAt ?? now,
      updated: now,
      eventType: 'default',
      start: { dateTime: '2026-11-20T10:00:00Z' },
      end: { dateTime: '2026-11-20T11:00:00Z' },
      ...extra,
    },
  });
}

function daysAgo({ days }: { days: number }): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
}

function inviteFields({ responseStatus }: { responseStatus: string }): Partial<VendorEvent> {
  return {
    organizer: { email: 'organizer@other.example.com', self: false },
    attendees: [
      { email: 'organizer@other.example.com', responseStatus: 'accepted' },
      { email: 'me@example.com', self: true, responseStatus },
    ],
  };
}

function ownWithGuestsFields(): Partial<VendorEvent> {
  return {
    organizer: { email: 'me@example.com', self: true },
    attendees: [
      { email: 'me@example.com', self: true, organizer: true, responseStatus: 'accepted' },
      { email: 'guest@other.example.com', responseStatus: 'needsAction' },
      { email: 'second-guest@other.example.com', responseStatus: 'accepted' },
    ],
  };
}

function editEvent({ id, changes }: { id: string; changes: Partial<VendorEvent> }): void {
  const latest = [...google.changes].reverse().find((change) => change.event.id === id);
  if (!latest) {
    throw new Error(`no event ${id}`);
  }
  google.version += 1;
  google.changes.push({
    version: google.version,
    event: { ...latest.event, ...changes, updated: new Date().toISOString() },
  });
}

function changedSince(version: number): VendorEvent[] {
  const byId = new Map<string, VendorEvent>();
  google.changes.filter((change) => change.version > version).forEach((change) => byId.set(change.event.id, change.event));
  return Array.from(byId.values());
}

function liveChannelIds(): string[] {
  return Array.from(google.channels.values()).filter((channel) => channel.active).map((channel) => channel.id);
}

async function fakeGoogle(request: HttpRequest): Promise<{ status: number; headers: Record<string, string>; body: unknown }> {
  await sleep(5);
  const fail = (status: number) => new HttpError(request.body, { status, responseBody: { error: { code: status } } });
  const body = isRecord(request.body) ? request.body : {};
  if (request.url.endsWith('/events/watch')) {
    const id = String(body['id']);
    google.channels.set(id, { id, active: true });
    return { status: 200, headers: {}, body: { kind: 'api#channel', id, resourceId: 'res-primary', expiration: String(body['expiration']) } };
  }
  if (request.url.endsWith('/channels/stop')) {
    if (google.failStopCalls > 0) {
      google.failStopCalls -= 1;
      throw fail(503);
    }
    const channel = google.channels.get(String(body['id']));
    if (!channel || !channel.active) {
      throw fail(404);
    }
    channel.active = false;
    return { status: 200, headers: {}, body: '' };
  }
  const params: Record<string, string> = { ...(request.queryParams ?? {}) };
  const syncToken = params['syncToken'];
  if (syncToken === undefined && google.failFullSyncCalls > 0) {
    google.failFullSyncCalls -= 1;
    throw fail(503);
  }
  const since = syncToken === undefined ? 0 : Number(syncToken.replace('tok-', ''));
  const page: Record<string, unknown> = { kind: 'calendar#events', nextSyncToken: `tok-${google.version}` };
  if (params['fields'] === undefined) {
    page['items'] = changedSince(since);
  }
  return { status: 200, headers: {}, body: page };
}

async function pushFromEveryChannel({ store }: { store: Store }): Promise<string[]> {
  const outputs = await Promise.all(
    liveChannelIds().map((channelId) => trigger.run(hookContext({ store, headers: pushHeaders({ channelId }) })))
  );
  return serverDedupe({ flowVersionId: `fv-${Math.random()}`, outputs }).map(idOf);
}

function serverDedupe({ flowVersionId, outputs }: { flowVersionId: string; outputs: unknown[][] }): unknown[] {
  const counters = new Map<string, number>();
  return outputs.flat().filter((payload) => {
    const key = isRecord(payload) ? payload[DEDUPE_KEY_PROPERTY] : undefined;
    if (key === undefined || key === null) {
      return true;
    }
    const counterKey = `${flowVersionId}:${String(key)}`;
    const count = (counters.get(counterKey) ?? 0) + 1;
    counters.set(counterKey, count);
    return count === 1;
  });
}

function pushHeaders({ channelId }: { channelId: string }): Record<string, string> {
  return { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': channelId, 'x-goog-resource-id': 'res-primary' };
}

function storedWatchId({ store }: { store: Store }): string {
  const data = memoryData.get(store);
  const raw = data?.get(WATCH_KEY);
  const watch: unknown = raw === undefined ? null : JSON.parse(raw);
  return isRecord(watch) ? String(watch['id']) : '';
}

const memoryData = new WeakMap<Store, Map<string, string>>();

function memoryStore(): { store: Store } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      await sleep(2);
      data.set(key, JSON.stringify(value));
      return value;
    },
    async get<T>(key: string): Promise<T | null> {
      await sleep(2);
      const raw = data.get(key);
      return raw === undefined ? null : JSON.parse(raw);
    },
    async delete(key: string): Promise<void> {
      await sleep(2);
      data.delete(key);
    },
  };
  memoryData.set(store, data);
  return { store };
}

function hookContext({ store, headers, isRepublish, calendarId }: { store: Store; headers?: Record<string, string>; isRepublish?: boolean; calendarId?: string }): Parameters<typeof trigger.run>[0] {
  return Reflect.apply(fakeContext, undefined, [{ store, headers, isRepublish, calendarId }]);
}

function fakeContext({ store, headers, isRepublish, calendarId }: { store: Store; headers?: Record<string, string>; isRepublish?: boolean; calendarId?: string }) {
  return {
    store,
    isRepublish,
    auth: { type: AppConnectionType.OAUTH2, access_token: 'token-123', data: {} },
    propsValue: { calendar_id: calendarId ?? 'primary', event_types: undefined, search_filter: undefined, exclude_all_day: false },
    webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
    payload: { headers: headers ?? {}, body: {}, queryParams: {} },
    files: {},
  };
}

function idOf(item: unknown): string {
  return isRecord(item) ? String(item['id']) : '';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type FakeGoogleState = {
  version: number;
  changes: { version: number; event: VendorEvent }[];
  channels: Map<string, { id: string; active: boolean }>;
  failFullSyncCalls: number;
  failStopCalls: number;
};

type VendorEvent = {
  kind: string;
  id: string;
  status: string;
  summary: string;
  created: string;
  updated: string;
  eventType: string;
  start: { dateTime: string };
  end: { dateTime: string };
  recurrence?: string[];
  recurringEventId?: string;
  originalStartTime?: { dateTime: string };
  organizer?: { email: string; self?: boolean };
  attendees?: { email: string; self?: boolean; organizer?: boolean; responseStatus: string }[];
};
