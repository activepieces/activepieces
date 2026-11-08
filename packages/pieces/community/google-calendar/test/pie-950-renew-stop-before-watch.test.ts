/// <reference types="vitest/globals" />

import { HttpError, HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType, Store, tryCatch } from '@activepieces/pieces-framework';
import { newEvent } from '../src/lib/triggers/new-event';
import { memoryStore, triggerContext } from './range-fake-google';

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

let live = new Set<string>();
let nextId = 1;
let failNextWatch = false;

function installFakeGoogle() {
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    if (request.url.endsWith('/events/watch')) {
      if (failNextWatch) {
        failNextWatch = false;
        throw new HttpError({}, { status: 503, responseBody: { error: { code: 503, message: 'Backend Error' } } });
      }
      const id = `ch-${nextId++}`;
      live.add(id);
      return { status: 200, headers: {}, body: { id, resourceId: `res-${id}`, expiration: String(Date.now() + 6 * 86400000) } };
    }
    if (request.url.endsWith('/channels/stop')) {
      const id = String(Reflect.get(Object(request.body), 'id'));
      if (!live.has(id)) {
        throw new HttpError({}, { status: 404, responseBody: { error: { code: 404, message: `Channel '${id}' not found for project` } } });
      }
      live.delete(id);
      return { status: 204, headers: {}, body: {} };
    }
    return { status: 200, headers: {}, body: { nextSyncToken: 'sync-1' } };
  });
}

function ctx(store: Store): Parameters<typeof newEvent.onRenew>[0] {
  return triggerContext({
    value: {
      auth: AUTH,
      propsValue: { calendar_id: 'primary' },
      store,
      webhookUrl: 'https://cloud.example.com/api/v1/webhooks/flow-1',
    },
  });
}

async function renew(store: Store): Promise<'ok' | 'failed'> {
  const { error } = await tryCatch(() => newEvent.onRenew(ctx(store)));
  return error ? 'failed' : 'ok';
}

async function storedWatchId(store: Store): Promise<string> {
  const watch = await store.get<{ id: string }>('google_calendar_watch');
  return watch?.id ?? '';
}

beforeEach(() => {
  live = new Set();
  nextId = 1;
  failNextWatch = false;
  installFakeGoogle();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Event watch renewal', () => {
  it('control: normal renewals keep exactly one live channel', async () => {
    const { store } = memoryStore();
    await newEvent.onEnable(ctx(store));
    expect(await renew(store)).toBe('ok');
    expect(await renew(store)).toBe('ok');
    expect(live.size).toBe(1);
    expect(live.has(await storedWatchId(store))).toBe(true);
  });

  it('after one failed replacement call, the next renewal restores a live channel', async () => {
    const { store } = memoryStore();
    await newEvent.onEnable(ctx(store));

    failNextWatch = true;
    await renew(store);

    await renew(store);
    await renew(store);

    expect(live.size).toBeGreaterThan(0);
    expect(live.has(await storedWatchId(store))).toBe(true);
  });
});
