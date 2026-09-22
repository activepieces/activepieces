// @vitest-environment jsdom
import type { SeekPage } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  DestinationType,
  EventDestinationScope,
} from '@activepieces/shared';
import type { EventDestination } from '@activepieces/shared';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { eventDestinationsCollection } from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost',
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

function makeDestination(id: string): EventDestination {
  return {
    id,
    created: '2024-01-01T00:00:00.000Z',
    updated: '2024-01-01T00:00:00.000Z',
    platformId: 'platform1',
    scope: EventDestinationScope.PLATFORM,
    events: [ApplicationEventName.FLOW_RUN_FINISHED],
    url: `https://example.com/${id}`,
    name: null,
    type: DestinationType.CUSTOM,
    enabled: true,
    mapper: null,
    headers: {},
  };
}

function makePage(
  data: EventDestination[],
  next: string | null,
): SeekPage<EventDestination> {
  return { data, next, previous: null };
}

function destinationRequests(): unknown[] {
  return vi
    .mocked(api.get)
    .mock.calls.filter((call) => call[0] === '/v1/event-destinations')
    .map((call) => call[1]);
}

describe('eventDestinationsCollection', () => {
  afterEach(() => {
    vi.mocked(api.get).mockReset();
  });

  it('loads every page the server offers, not just the first one', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(makePage([makeDestination('d1')], 'cursor1'))
      .mockResolvedValueOnce(makePage([makeDestination('d2')], 'cursor2'))
      .mockResolvedValueOnce(makePage([makeDestination('d3')], null));

    await eventDestinationsCollection.preload();

    expect([...eventDestinationsCollection.values()].map((row) => row.id)).toEqual([
      'd1',
      'd2',
      'd3',
    ]);
    expect(destinationRequests()).toEqual([
      { cursor: undefined, limit: 100 },
      { cursor: 'cursor1', limit: 100 },
      { cursor: 'cursor2', limit: 100 },
    ]);
  });
});
