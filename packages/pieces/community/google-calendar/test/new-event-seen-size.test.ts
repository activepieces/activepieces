import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { Store } from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newEvent as trigger } from '../src/lib/triggers/new-event';
import { fakeAuth, idsOf, triggerContext } from './range-fake-google';

const STATE_KEY = 'google_calendar_new_event_state';
const STORE_VALUE_MAX_SIZE = 512 * 1024;
const BULK = 10_000;

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
  vi.spyOn(console, 'warn').mockImplementation(() => undefined);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('New Event keeps its memory under the store limit', () => {
  it('fires 10,000 events created in the same millisecond once each, saves its state, and never fires them again', async () => {
    const { store, data } = limitedStore();
    await trigger.onEnable(hookContext({ store }));
    vi.setSystemTime(Date.parse('2026-10-01T10:05:00Z'));
    const createdIso = '2026-10-01T10:04:00.000Z';
    for (let index = 0; index < BULK; index++) {
      change({ event: ownEvent({ id: googleId({ index }), createdIso, updatedIso: createdIso }) });
    }

    const first = idsOf(await trigger.run(pushContext({ store })));
    expect(first).toHaveLength(BULK);
    expect(new Set(first).size).toBe(BULK);
    expect(Buffer.byteLength(data.get(STATE_KEY) ?? '', 'utf8')).toBeLessThanOrEqual(STORE_VALUE_MAX_SIZE);

    vi.setSystemTime(Date.parse('2026-10-01T10:06:00Z'));
    for (let index = 0; index < BULK; index += 7) {
      change({ event: ownEvent({ id: googleId({ index }), createdIso, updatedIso: '2026-10-01T10:06:00.000Z' }) });
    }
    change({ event: ownEvent({ id: 'brand-new', createdIso: '2026-10-01T10:06:00.000Z', updatedIso: '2026-10-01T10:06:00.000Z' }) });
    expect(idsOf(await trigger.run(pushContext({ store })))).toEqual(['brand-new']);
    expect(await trigger.run(pushContext({ store }))).toEqual([]);
  });
});

function change({ event }: { event: Record<string, unknown> }): void {
  google.version += 1;
  google.changes.push({ version: google.version, event });
}

function googleId({ index }: { index: number }): string {
  return `${index.toString(32).padStart(4, '0')}k3v9q2m7r1t5u8a0b4c6d2e8`;
}

function ownEvent({ id, createdIso, updatedIso }: { id: string; createdIso: string; updatedIso: string }): Record<string, unknown> {
  return {
    id,
    status: 'confirmed',
    summary: id,
    created: createdIso,
    updated: updatedIso,
    organizer: { email: 'me@example.com', self: true },
    start: { dateTime: '2026-10-20T10:00:00Z' },
    end: { dateTime: '2026-10-20T11:00:00Z' },
  };
}

function limitedStore(): { store: Store; data: Map<string, string> } {
  const data = new Map<string, string>();
  const store: Store = {
    async put<T>(key: string, value: T): Promise<T> {
      const serialized = JSON.stringify(value);
      if (Buffer.byteLength(serialized, 'utf8') > STORE_VALUE_MAX_SIZE) {
        throw new Error(`StorageLimitError: ${key} is larger than ${STORE_VALUE_MAX_SIZE} bytes`);
      }
      data.set(key, serialized);
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
      payload: { headers: { 'x-goog-resource-state': 'exists', 'x-goog-channel-id': `ch-${google.nextChannel - 1}` }, body: {} },
    },
  });
}

type FakeGoogle = {
  version: number;
  changes: { version: number; event: Record<string, unknown> }[];
  nextChannel: number;
};
