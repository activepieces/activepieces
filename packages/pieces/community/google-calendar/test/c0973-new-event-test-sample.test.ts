/// <reference types="vitest/globals" />

// C0973 / C0977: New Event's test() (the builder's "Test trigger" / load sample
// data) takes only the single most recently updated event of the last day
// (showDeleted=true) and then applies the configured filters to that one
// event. run() applies the same filters to every changed event and skips
// cancelled ones (new-event.ts:244-255).
//
// Stand-ins (mocks): httpClient.sendRequest is a fake Google events.list
// endpoint returning the recent events ordered by `updated` ascending (the
// order Google uses for orderBy=updated). The trigger's real test() is called.

import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { newEvent } from '../src/lib/triggers/new-event';

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

type Ev = Record<string, unknown> & { id: string };

function installFakeGoogle(recentByUpdatedAsc: Ev[]) {
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest) => {
    const q = (request.queryParams ?? {}) as Record<string, string>;
    if (!request.url.includes('/events') || q['orderBy'] !== 'updated') {
      throw new Error(`unexpected request ${request.url}`);
    }
    const items = q['showDeleted'] === 'true' ? recentByUpdatedAsc : recentByUpdatedAsc.filter((e) => e.status !== 'cancelled');
    return { status: 200, headers: {}, body: { items } };
  });
}

function ctx(propsValue: Record<string, unknown>) {
  return { auth: AUTH, propsValue: { calendar_id: 'primary', ...propsValue }, store: {}, files: {} } as never;
}

const standup: Ev = {
  id: 'standup-1',
  status: 'confirmed',
  summary: 'Daily standup',
  created: '2026-10-01T08:00:00.000Z',
  updated: '2026-10-01T08:00:00.000Z',
  start: { dateTime: '2026-10-02T09:00:00Z' },
  end: { dateTime: '2026-10-02T09:15:00Z' },
  eventType: 'default',
};
const lunch: Ev = {
  id: 'lunch-1',
  status: 'confirmed',
  summary: 'Lunch with Sam',
  created: '2026-10-01T09:00:00.000Z',
  updated: '2026-10-01T09:00:00.000Z',
  start: { dateTime: '2026-10-02T12:00:00Z' },
  end: { dateTime: '2026-10-02T13:00:00Z' },
  eventType: 'default',
};
const deleted: Ev = { id: 'deleted-1', status: 'cancelled', updated: '2026-10-01T10:00:00.000Z' };

afterEach(() => {
  vi.restoreAllMocks();
});

describe('New Event test() returns a sample that run() would emit', () => {
  it('control: newest event matches the filter and is returned', async () => {
    installFakeGoogle([lunch, standup]);
    const sample = (await newEvent.test(ctx({ search_filter: 'standup' }))) as Ev[];
    expect(sample.map((e) => e.id)).toContain('standup-1');
  });

  it('returns a recent matching event even when the newest change does not match the filter', async () => {
    installFakeGoogle([standup, lunch]);
    const sample = (await newEvent.test(ctx({ search_filter: 'standup' }))) as Ev[];
    expect(sample.map((e) => e.id)).toContain('standup-1');
  });

  it('does not return a cancelled (deleted) event as the New Event sample', async () => {
    installFakeGoogle([standup, deleted]);
    const sample = (await newEvent.test(ctx({}))) as Ev[];
    expect(sample.length).toBeGreaterThan(0);
    expect(sample.every((e) => e.status !== 'cancelled')).toBe(true);
  });
});
