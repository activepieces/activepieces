import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent as trigger } from '../src/lib/triggers/new-event';
import { fakeAuth, idsOf, memoryStore, triggerContext } from './range-fake-google';

const WATCH_KEY = 'google_calendar_watch';

const google: FakeGoogle = {
  live: new Set<string>(),
  nextChannel: 1,
  failNextWatch: false,
  failNextStop: false,
  events: [],
};

beforeEach(() => {
  google.live = new Set<string>();
  google.nextChannel = 1;
  google.failNextWatch = false;
  google.failNextStop = false;
  google.events = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) =>
    Reflect.apply(answer, undefined, [request])
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Event watch renewal', () => {
  it('creates and saves the new channel before stopping the old one', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const before = await watchIdOf({ store });
    await trigger.onRenew(hookContext({ store }));
    const after = await watchIdOf({ store });
    expect(after).not.toBe(before);
    expect([...google.live]).toEqual([after]);
  });

  it('keeps the old channel stored and alive when creating the new one fails, and the next renewal recovers', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const original = await watchIdOf({ store });
    google.failNextWatch = true;
    await expect(trigger.onRenew(hookContext({ store }))).rejects.toThrow();
    expect(await watchIdOf({ store })).toBe(original);
    expect(google.live.has(original)).toBe(true);
    await trigger.onRenew(hookContext({ store }));
    const renewed = await watchIdOf({ store });
    expect([...google.live]).toEqual([renewed]);
  });

  it('logs and does not throw when stopping the old channel fails', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    google.failNextStop = true;
    await trigger.onRenew(hookContext({ store }));
    expect(google.live.has(await watchIdOf({ store }))).toBe(true);
    expect(warn).toHaveBeenCalled();
  });

  it('stops the new channel and rethrows when saving it fails', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const original = await watchIdOf({ store });
    const failingStore: Store = {
      get: store.get,
      delete: store.delete,
      put: async () => {
        throw new Error('store unavailable');
      },
    };
    await expect(trigger.onRenew(hookContext({ store: failingStore }))).rejects.toThrow('store unavailable');
    expect([...google.live]).toEqual([original]);
    expect(await watchIdOf({ store })).toBe(original);
  });

  it('processes a push from the new channel right after the renewal and ignores the old one', async () => {
    const { store } = memoryStore();
    await trigger.onEnable(hookContext({ store }));
    const original = await watchIdOf({ store });
    await trigger.onRenew(hookContext({ store }));
    const renewed = await watchIdOf({ store });
    google.events = [{ id: 'booking', status: 'confirmed', created: new Date(Date.now() + 1000).toISOString(), updated: new Date(Date.now() + 1000).toISOString(), summary: 'Booking', start: { dateTime: '2026-12-01T10:00:00Z' }, end: { dateTime: '2026-12-01T11:00:00Z' } }];
    expect(await trigger.run(pushContext({ store, channelId: original }))).toEqual([]);
    expect(idsOf(await trigger.run(pushContext({ store, channelId: renewed })))).toEqual(['booking']);
  });
});

async function watchIdOf({ store }: { store: Store }): Promise<string> {
  const watch = await store.get<{ id: string }>(WATCH_KEY);
  return watch?.id ?? '';
}

async function answer(request: HttpRequest): Promise<unknown> {
  if (request.url.endsWith('/events/watch')) {
    if (google.failNextWatch) {
      google.failNextWatch = false;
      throw new HttpError({}, { status: 503, responseBody: { error: { code: 503 } } });
    }
    const id = `ch-${google.nextChannel++}`;
    google.live.add(id);
    return { status: 200, headers: {}, body: { id, resourceId: `res-${id}` } };
  }
  if (request.url.endsWith('/channels/stop')) {
    const id = String(Reflect.get(Object(request.body), 'id'));
    if (google.failNextStop) {
      google.failNextStop = false;
      throw new HttpError({}, { status: 500, responseBody: { error: { code: 500 } } });
    }
    if (!google.live.has(id)) {
      throw new HttpError({}, { status: 404, responseBody: { error: { code: 404 } } });
    }
    google.live.delete(id);
    return { status: 204, headers: {}, body: {} };
  }
  const query: Record<string, string> = { ...(request.queryParams ?? {}) };
  if (query['syncToken']) {
    return { status: 200, headers: {}, body: { items: google.events, nextSyncToken: 'sync-2' } };
  }
  return { status: 200, headers: {}, body: { nextSyncToken: 'sync-1' } };
}

function hookContext({ store }: { store: Store }): Parameters<typeof trigger.onRenew>[0] {
  return triggerContext({
    value: {
      auth: fakeAuth,
      store,
      propsValue: { calendar_id: 'primary' },
      webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
    },
  });
}

function pushContext({ store, channelId }: { store: Store; channelId: string }): Parameters<typeof trigger.run>[0] {
  return triggerContext({
    value: {
      auth: fakeAuth,
      store,
      propsValue: { calendar_id: 'primary' },
      webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
      payload: { headers: { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': channelId }, body: {} },
    },
  });
}

type FakeGoogle = {
  live: Set<string>;
  nextChannel: number;
  failNextWatch: boolean;
  failNextStop: boolean;
  events: Record<string, unknown>[];
};
