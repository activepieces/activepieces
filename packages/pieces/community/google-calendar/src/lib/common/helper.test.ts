import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCalendars,
  getInitialSyncToken,
  listEventsForFullSync,
  listEventsWithSyncToken,
  listRecentLiveEvents,
} from './helper';

const AUTH = {
  type: AppConnectionType.OAUTH2 as const,
  access_token: 'token-123',
  data: {},
};

const RESPONSE_SHAPING_PARAMS = ['syncToken', 'pageToken', 'fields'];

function stubHttpClient(bodies: unknown[]): Record<string, string>[] {
  const captured: Record<string, string>[] = [];
  vi.spyOn(httpClient, 'sendRequest').mockImplementation(
    async (request: HttpRequest) => {
      captured.push({ ...request.queryParams });
      return {
        status: 200,
        headers: {},
        body: bodies[captured.length - 1],
      };
    }
  );
  return captured;
}

function seriesFilters(params: Record<string, string>): string[] {
  return Object.keys(params)
    .filter((key) => !RESPONSE_SHAPING_PARAMS.includes(key))
    .sort();
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('getInitialSyncToken', () => {
  it('does not ask Google to expand recurring events into instances', async () => {
    const captured = stubHttpClient([{ items: [], nextSyncToken: 'sync-1' }]);

    await getInitialSyncToken({ calendarId: 'primary', authProp: AUTH });

    expect(captured[0]['singleEvents']).toBeUndefined();
    expect(captured[0]['showDeleted']).toBeUndefined();
    expect(captured[0]['maxResults']).toBe('2500');
  });

  it('sends the same series filters as the incremental call it seeds', async () => {
    const fullSync = stubHttpClient([{ items: [], nextSyncToken: 'sync-1' }]);
    await getInitialSyncToken({ calendarId: 'primary', authProp: AUTH });

    const incremental = stubHttpClient([{ items: [], nextSyncToken: 'sync-2' }]);
    await listEventsWithSyncToken({
      calendarId: 'primary',
      syncToken: 'sync-1',
      authProp: AUTH,
    });

    expect(seriesFilters(fullSync[0])).toEqual(seriesFilters(incremental[0]));
  });

  it('asks Google for the tokens only, never the event bodies it discards', async () => {
    const captured = stubHttpClient([{ nextSyncToken: 'sync-1' }]);

    await getInitialSyncToken({ calendarId: 'primary', authProp: AUTH });

    expect(captured[0]['fields']).toBe('nextPageToken,nextSyncToken');
  });

  it('pages until Google stops returning a page token and keeps the final sync token', async () => {
    const captured = stubHttpClient([
      { items: [{ id: 'a' }], nextPageToken: 'page-2' },
      { items: [{ id: 'b' }], nextPageToken: 'page-3' },
      { items: [{ id: 'c' }], nextSyncToken: 'sync-final' },
    ]);

    const token = await getInitialSyncToken({
      calendarId: 'primary',
      authProp: AUTH,
    });

    expect(token).toBe('sync-final');
    expect(captured).toHaveLength(3);
    expect(captured[1]['pageToken']).toBe('page-2');
    expect(captured[2]['pageToken']).toBe('page-3');
  });
  it('stops at the deadline without a sync token instead of paging the whole calendar', async () => {
    const captured = stubHttpClient([
      { nextPageToken: 'page-2' },
      { nextPageToken: 'page-3' },
      { nextSyncToken: 'sync-late' },
    ]);

    const token = await getInitialSyncToken({
      calendarId: 'primary',
      authProp: AUTH,
      deadlineMs: Date.now(),
    });

    expect(token).toBeUndefined();
    expect(captured).toHaveLength(0);
  });
});

describe('listEventsForFullSync', () => {
  it('returns the event bodies from every page and the sync token of the last page', async () => {
    const captured = stubHttpClient([
      { items: [{ id: 'a' }], nextPageToken: 'page-2' },
      { items: [{ id: 'b' }, { id: 'c' }], nextSyncToken: 'sync-final' },
    ]);

    const { items, nextSyncToken } = await listEventsForFullSync({
      calendarId: 'primary',
      authProp: AUTH,
      withItems: true,
    });

    expect(items.map((item) => item.id)).toEqual(['a', 'b', 'c']);
    expect(nextSyncToken).toBe('sync-final');
    expect(captured[0]['fields']).toBeUndefined();
    expect(captured[0]['syncToken']).toBeUndefined();
    expect(seriesFilters(captured[0])).toEqual(['maxResults']);
  });
});

describe('listEventsForFullSync with an item filter', () => {
  it('keeps only the items the filter accepts on every page and the last page sync token', async () => {
    stubHttpClient([
      { items: [{ id: 'keep-1' }, { id: 'drop-1' }], nextPageToken: 'page-2' },
      { items: [{ id: 'drop-2' }, { id: 'keep-2' }], nextPageToken: 'page-3' },
      { items: [{ id: 'drop-3' }], nextSyncToken: 'sync-final' },
    ]);
    const offered: string[] = [];

    const { items, nextSyncToken } = await listEventsForFullSync({
      calendarId: 'primary',
      authProp: AUTH,
      withItems: true,
      keepItem: (event) => {
        offered.push(event.id);
        return event.id.startsWith('keep-');
      },
    });

    expect(items.map((item) => item.id)).toEqual(['keep-1', 'keep-2']);
    expect(offered).toEqual(['keep-1', 'drop-1', 'drop-2', 'keep-2', 'drop-3']);
    expect(nextSyncToken).toBe('sync-final');
  });
});

describe('getCalendars', () => {
  it('reads every calendarList page and keeps the access-role filter on each', async () => {
    const captured = stubHttpClient([
      { items: [{ id: 'a' }], nextPageToken: 'page-2' },
      { items: [{ id: 'b' }], nextPageToken: 'page-3' },
      { items: [{ id: 'c' }] },
    ]);

    const calendars = await getCalendars(AUTH, 'writer');

    expect(calendars.map((calendar) => calendar.id)).toEqual(['a', 'b', 'c']);
    expect(captured).toHaveLength(3);
    expect(captured[0]['pageToken']).toBeUndefined();
    expect(captured[0]['maxResults']).toBe('250');
    expect(captured.every((query) => query['minAccessRole'] === 'writer')).toBe(true);
    expect(captured[2]['pageToken']).toBe('page-3');
  });

  it('tolerates a page without items', async () => {
    stubHttpClient([{ nextPageToken: 'page-2' }, { items: [{ id: 'a' }] }]);

    const calendars = await getCalendars(AUTH);

    expect(calendars.map((calendar) => calendar.id)).toEqual(['a']);
  });
});

describe('listRecentLiveEvents paging', () => {
  it('sends no empty page token and tolerates a page without items', async () => {
    const captured = stubHttpClient([
      { nextPageToken: 'page-2' },
      { items: [{ id: 'a', status: 'confirmed', updated: '2026-10-01T08:00:00.000Z' }] },
    ]);

    const events = await listRecentLiveEvents({
      calendarId: 'primary',
      authProp: AUTH,
      keep: () => true,
      limit: 5,
    });

    expect(events.map((event) => event.id)).toEqual(['a']);
    expect(Object.keys(captured[0])).not.toContain('pageToken');
    expect(captured[1]['pageToken']).toBe('page-2');
  });
});

describe('listRecentLiveEvents', () => {
  it('returns the newest live events that pass the filter, never a cancelled one', async () => {
    const captured = stubHttpClient([
      {
        items: [
          { id: 'old', status: 'confirmed', updated: '2026-10-01T08:00:00.000Z' },
          { id: 'skip', status: 'confirmed', updated: '2026-10-01T10:00:00.000Z' },
          { id: 'new', status: 'confirmed', updated: '2026-10-01T09:00:00.000Z' },
          { id: 'gone', status: 'cancelled', updated: '2026-10-01T11:00:00.000Z' },
        ],
      },
    ]);

    const events = await listRecentLiveEvents({
      calendarId: 'primary',
      authProp: AUTH,
      keep: (event) => event.id !== 'skip',
      limit: 5,
    });

    expect(events.map((event) => event.id)).toEqual(['new', 'old']);
    expect(captured[0]['showDeleted']).toBe('true');
    expect(captured[0]['orderBy']).toBe('updated');
  });
});
