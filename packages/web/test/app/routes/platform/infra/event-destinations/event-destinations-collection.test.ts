// @vitest-environment jsdom
import { tryCatch } from '@activepieces/core-utils';
import type { SeekPage } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  EventDestinationFormat,
  EventDestinationScope,
} from '@activepieces/shared';
import type { EventDestination } from '@activepieces/shared';
import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  eventDestinationsCollection,
  eventDestinationsCollectionUtils,
} from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';
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
    enabled: true,
    headers: {},
    format: EventDestinationFormat.RAW,
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
    vi.mocked(api.post).mockReset();
    vi.useRealTimers();
  });

  it('loads every page the server offers, not just the first one', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(makePage([makeDestination('d1')], 'cursor1'))
      .mockResolvedValueOnce(makePage([makeDestination('d2')], 'cursor2'))
      .mockResolvedValueOnce(makePage([makeDestination('d3')], null));

    await eventDestinationsCollection.preload();

    expect(
      [...eventDestinationsCollection.values()].map((row) => row.id),
    ).toEqual(['d1', 'd2', 'd3']);
    expect(destinationRequests()).toEqual([
      { cursor: undefined, limit: 100 },
      { cursor: 'cursor1', limit: 100 },
      { cursor: 'cursor2', limit: 100 },
    ]);
  });

  it('reports a failed load, and clears it once a retry succeeds', async () => {
    vi.useFakeTimers();
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useAll(true),
    );

    await act(async () => {
      const failedLoad = eventDestinationsCollectionUtils.refetch();
      await vi.advanceTimersByTimeAsync(QUERY_RETRY_WINDOW_MS);
      await failedLoad;
    });
    expect(result.current.isError).toBe(true);

    vi.mocked(api.get).mockResolvedValue(
      makePage([makeDestination('d4')], null),
    );
    await act(() => eventDestinationsCollectionUtils.refetch());
    expect(result.current.isError).toBe(false);
  });

  it('sends only the changed field when a destination is toggled', async () => {
    const stored: EventDestination = {
      ...makeDestination('t1'),
      headers: { Authorization: null },
    };
    vi.mocked(api.get).mockResolvedValue(makePage([stored], null));
    renderHook(() => eventDestinationsCollectionUtils.useAll(true));
    await act(() => eventDestinationsCollectionUtils.refetch());
    vi.mocked(api.post).mockResolvedValue({ ...stored, enabled: false });
    vi.mocked(api.get).mockResolvedValue(
      makePage([{ ...stored, enabled: false }], null),
    );

    await act(
      () =>
        eventDestinationsCollectionUtils.update({
          destinationId: 't1',
          request: { enabled: false },
        }).isPersisted.promise,
    );

    const postCalls = vi.mocked(api.post).mock.calls;
    expect(postCalls).toHaveLength(1);
    expect(postCalls[0][0]).toBe('/v1/event-destinations/t1');
    expect(JSON.stringify(postCalls[0][1])).toBe('{"enabled":false}');
    expect(eventDestinationsCollection.get('t1')?.enabled).toBe(false);
  });

  it('rolls a failed toggle back and hands the error to the caller', async () => {
    vi.mocked(api.get).mockResolvedValue(
      makePage([makeDestination('t2')], null),
    );
    renderHook(() => eventDestinationsCollectionUtils.useAll(true));
    await act(() => eventDestinationsCollectionUtils.refetch());
    const failure = new Error('server down');
    vi.mocked(api.post).mockRejectedValue(failure);

    const { error } = await act(() =>
      tryCatch(
        () =>
          eventDestinationsCollectionUtils.update({
            destinationId: 't2',
            request: { enabled: false },
          }).isPersisted.promise,
      ),
    );

    expect(error).toBe(failure);
    expect(eventDestinationsCollection.get('t2')?.enabled).toBe(true);
  });
});

const QUERY_RETRY_WINDOW_MS = 10_000;
