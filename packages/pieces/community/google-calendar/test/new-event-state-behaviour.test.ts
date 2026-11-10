import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store, tryCatch } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent as trigger } from '../src/lib/triggers/new-event';
import { fakeAuth, idsOf, memoryStore, triggerContext } from './range-fake-google';

const STATE_KEY = 'google_calendar_new_event_state';

const google: FakeGoogle = { version: 0, changes: [], nextChannel: 1 };

beforeEach(() => {
  google.version = 0;
  google.changes = [];
  google.nextChannel = 1;
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(Date.parse('2026-10-01T10:00:00Z'));
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) =>
    Reflect.apply(answer, undefined, [request])
  );
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('New Event keeps its memory in one store value', () => {
  for (const failingPut of [1, 2, 3]) {
    it(`returns every new event and invitation exactly once when store write #${failingPut} of a notification fails once`, async () => {
      const { store } = memoryStore();
      await trigger.onEnable(hookContext({ store }));
      vi.setSystemTime(Date.parse('2026-10-01T10:05:00Z'));
      change({ event: ownEvent({ id: 'booking' }) });
      change({ event: invitation({ id: 'invite' }) });
      const failing = failingStore({ store, failingPut });
      const fired: string[] = [];
      const first = await tryCatch(() => trigger.run(pushContext({ store: failing })));
      fired.push(...(first.error ? [] : idsOf(first.data)));
      for (let retry = 0; retry < 2; retry++) {
        fired.push(...idsOf(await trigger.run(pushContext({ store }))));
      }
      expect(fired.sort()).toEqual(['booking', 'invite']);
    });
  }

  it('forgets a remembered invitation when Google returns it deleted with only its id and status', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    vi.setSystemTime(Date.parse('2026-10-01T10:05:00Z'));
    change({ event: invitation({ id: 'invite' }) });
    expect(idsOf(await trigger.run(pushContext({ store })))).toEqual(['invite']);
    expect(await rememberedInvites({ store })).toEqual(['invite']);
    change({ event: { id: 'invite', status: 'cancelled' } });
    expect(await trigger.run(pushContext({ store }))).toEqual([]);
    expect(await rememberedInvites({ store })).toEqual([]);
  });
});

function change({ event }: { event: Record<string, unknown> }): void {
  google.version += 1;
  google.changes.push({ version: google.version, event });
}

function ownEvent({ id, createdIso }: { id: string; createdIso?: string }): Record<string, unknown> {
  const created = createdIso ?? new Date(Date.now()).toISOString();
  return {
    id,
    status: 'confirmed',
    summary: id,
    created,
    updated: created,
    organizer: { email: 'me@example.com', self: true },
    start: { dateTime: '2026-10-20T10:00:00Z' },
    end: { dateTime: '2026-10-20T11:00:00Z' },
  };
}

function invitation({ id, createdIso }: { id: string; createdIso?: string }): Record<string, unknown> {
  return {
    ...ownEvent({ id, createdIso }),
    organizer: { email: 'boss@example.com' },
    attendees: [{ email: 'me@example.com', self: true, responseStatus: 'needsAction' }],
  };
}

async function rememberedInvites({ store }: { store: Store }): Promise<string[]> {
  const state = await store.get<{ invites: { id: string }[] }>(STATE_KEY);
  return (state?.invites ?? []).map((entry) => entry.id).sort();
}

function failingStore({ store, failingPut }: { store: Store; failingPut: number }): Store {
  const puts = { count: 0 };
  return {
    get: store.get,
    delete: store.delete,
    put: async <T>(key: string, value: T): Promise<T> => {
      puts.count += 1;
      if (puts.count === failingPut) {
        throw new Error(`store put ${failingPut} failed`);
      }
      return store.put(key, value);
    },
  };
}

async function answer(request: HttpRequest): Promise<unknown> {
  if (request.url.endsWith('/events/watch')) {
    const id = `ch-${google.nextChannel++}`;
    return { status: 200, headers: {}, body: { id, resourceId: `res-${id}` } };
  }
  if (request.url.endsWith('/channels/stop')) {
    return { status: 204, headers: {}, body: {} };
  }
  const query: Record<string, string> = { ...(request.queryParams ?? {}) };
  const since = query['syncToken'] ? Number(query['syncToken'].replace('tok-', '')) : 0;
  const latest = new Map<string, Record<string, unknown>>();
  google.changes
    .filter((entry) => entry.version > since)
    .forEach((entry) => latest.set(String(entry.event['id']), entry.event));
  const body: Record<string, unknown> = { nextSyncToken: `tok-${google.version}` };
  if (query['fields'] === undefined) {
    body['items'] = [...latest.values()];
  }
  return { status: 200, headers: {}, body };
}

function hookContext({ store }: { store: Store }): Parameters<typeof trigger.onEnable>[0] {
  return triggerContext({
    value: {
      auth: fakeAuth,
      store,
      propsValue: { calendar_id: 'primary' },
      webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
    },
  });
}

function pushContext({ store }: { store: Store }): Parameters<typeof trigger.run>[0] {
  return triggerContext({
    value: {
      auth: fakeAuth,
      store,
      propsValue: { calendar_id: 'primary' },
      webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
      payload: { headers: { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': liveChannel() }, body: {} },
    },
  });
}

function liveChannel(): string {
  return `ch-${google.nextChannel - 1}`;
}

type FakeGoogle = {
  version: number;
  changes: { version: number; event: Record<string, unknown> }[];
  nextChannel: number;
};
