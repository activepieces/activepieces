import { EventDestinationScope } from '@activepieces/shared';
import type { EventDestination } from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiGet, capturedOptions } = vi.hoisted(() => {
  const captured: { queryFn?: () => Promise<EventDestination[]> } = {};
  return { apiGet: vi.fn(), capturedOptions: captured };
});

vi.mock('@/lib/api', () => ({
  api: { get: apiGet },
}));

vi.mock('@/features/flows', () => ({
  flowHooks: {},
  flowsApi: {},
  triggerEventsApi: {},
}));

vi.mock('@/features/projects', () => ({
  projectCollectionUtils: {},
}));

vi.mock('@/hooks/user-hooks', () => ({
  userHooks: {},
}));

vi.mock('@tanstack/query-db-collection', () => ({
  queryCollectionOptions: vi.fn(
    (options: { queryFn: () => Promise<EventDestination[]> }) => {
      capturedOptions.queryFn = options.queryFn;
      return {
        getKey: (item: EventDestination) => item.id,
        sync: { sync: () => () => {}, getSyncMetadata: () => ({}) },
        startSync: false,
        gcTime: 0,
      };
    },
  ),
}));

await import(
  '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection'
);

function makeDestination(index: number): EventDestination {
  return {
    id: `destination${index}`,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    platformId: 'platform1',
    url: `https://example.com/hook/${index}`,
    events: [],
    scope: EventDestinationScope.PLATFORM,
  };
}

function runQueryFn(): Promise<EventDestination[]> {
  if (!capturedOptions.queryFn) {
    throw new Error('queryFn was not captured');
  }
  return capturedOptions.queryFn();
}

describe('eventDestinationsCollection queryFn', () => {
  beforeEach(() => {
    apiGet.mockReset();
  });

  it('follows the next cursor until every destination is loaded', async () => {
    const firstPage = Array.from({ length: 10 }, (_, i) => makeDestination(i));
    const secondPage = [makeDestination(10)];
    apiGet
      .mockResolvedValueOnce({
        data: firstPage,
        next: 'cursor2',
        previous: null,
      })
      .mockResolvedValueOnce({
        data: secondPage,
        next: null,
        previous: 'cursor1',
      });

    const result = await runQueryFn();

    expect(result.map((d) => d.id)).toEqual([
      ...firstPage.map((d) => d.id),
      'destination10',
    ]);
    expect(apiGet).toHaveBeenCalledTimes(2);
    expect(apiGet.mock.calls[0][1]).toEqual({ cursor: undefined, limit: 100 });
    expect(apiGet.mock.calls[1][1]).toEqual({ cursor: 'cursor2', limit: 100 });
  });

  it('makes a single request when everything fits in one page', async () => {
    apiGet.mockResolvedValueOnce({
      data: [makeDestination(0)],
      next: null,
      previous: null,
    });

    const result = await runQueryFn();

    expect(result).toHaveLength(1);
    expect(apiGet).toHaveBeenCalledTimes(1);
  });
});
