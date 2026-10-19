import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { AppConnectionType } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getInitialSyncToken, listEventsWithSyncToken } from './helper';

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
});
