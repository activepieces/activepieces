/// <reference types="vitest/globals" />
import path from 'path';
import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';

const NEW_EVENT_TRIGGER = path.resolve(
  __dirname,
  '../src/lib/triggers/new-event.ts'
);

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

const createdEvent = {
  kind: 'calendar#event',
  etag: '"3419997894982000"',
  id: 'evt-created',
  status: 'confirmed',
  created: '2026-10-01T08:00:00.000Z',
  updated: '2026-10-01T08:00:00.000Z',
  summary: 'Customer onboarding call',
  start: { dateTime: '2026-10-02T10:00:00Z' },
  end: { dateTime: '2026-10-02T11:00:00Z' },
  eventType: 'default',
};

const deletedEvent = {
  kind: 'calendar#event',
  etag: '"3419997894999000"',
  id: 'evt-deleted',
  status: 'cancelled',
  created: '2026-09-20T08:00:00.000Z',
  updated: '2026-10-01T09:30:00.000Z',
  summary: 'Old weekly sync',
  start: { dateTime: '2026-10-03T10:00:00Z' },
  end: { dateTime: '2026-10-03T11:00:00Z' },
  eventType: 'default',
};

function stubGoogle(handler: (request: HttpRequest) => unknown): HttpRequest[] {
  const seen: HttpRequest[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(
    async (request: HttpRequest) => {
      seen.push({ ...request, queryParams: { ...request.queryParams } });
      return { status: 200, headers: {}, body: handler(request) };
    }
  );
  return seen;
}

function memoryStore(initial: Record<string, unknown> = {}) {
  const data: Record<string, unknown> = { ...initial };
  return {
    data,
    put: async <T>(key: string, value: T) => {
      data[key] = value;
      return value;
    },
    get: async <T>(key: string): Promise<T | null> => (key in data ? Reflect.get(data, key) : null),
    delete: async (key: string) => {
      delete data[key];
    },
  };
}

function hookContext(extra: Record<string, unknown> = {}) {
  return {
    auth: AUTH,
    propsValue: {
      calendar_id: 'primary',
      event_types: undefined,
      search_filter: undefined,
      exclude_all_day: false,
    },
    store: memoryStore(),
    webhookUrl: 'https://example.invalid/v1/webhooks/flow-1',
    payload: {},
    files: { write: async () => 'file-url' },
    ...extra,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Google Calendar New Event trigger sample data', () => {
  it('control: the production run() never emits a cancelled event', async () => {
    const { newEvent } = await import(NEW_EVENT_TRIGGER);
    stubGoogle(() => ({
      items: [createdEvent, deletedEvent],
      nextSyncToken: 'sync-2',
    }));

    const emitted = await newEvent.run(
      hookContext({
        payload: { headers: { 'x-goog-resource-state': 'exists' }, body: {} },
        store: memoryStore({ google_calendar_sync_token: 'sync-1', google_calendar_new_event_state: { seen: [], createdFloorMs: Date.parse('2026-09-30T00:00:00.000Z'), invites: [], inviteFloorMs: 0 } }),
      })
    );

    expect(emitted.map((e: { id: string }) => e.id)).toEqual(['evt-created']);
  });

  it('Test trigger does not offer a cancelled event as the sample', async () => {
    const { newEvent } = await import(NEW_EVENT_TRIGGER);
    const requests = stubGoogle(() => ({
      items: [createdEvent, deletedEvent],
    }));

    const samples = await newEvent.test(hookContext());

    expect(requests[0].queryParams?.['showDeleted']).toBe('true');
    expect(requests[0].queryParams?.['orderBy']).toBe('updated');

    expect(
      samples.map((e: { id: string; status: string }) => `${e.id}:${e.status}`)
    ).not.toContain('evt-deleted:cancelled');
    expect(samples).toEqual([createdEvent]);
  });
});
