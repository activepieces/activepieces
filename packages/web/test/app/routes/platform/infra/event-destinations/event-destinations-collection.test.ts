// @vitest-environment jsdom
import { tryCatch } from '@activepieces/core-utils';
import type { SeekPage } from '@activepieces/core-utils';
import {
  ApplicationEventName,
  EventDestinationFormat,
  EventDestinationScope,
} from '@activepieces/shared';
import type {
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
} from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
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

function deferredPage(): DeferredPage {
  let resolvePage: (page: SeekPage<EventDestination>) => void = () => undefined;
  const promise = new Promise<SeekPage<EventDestination>>((resolve) => {
    resolvePage = resolve;
  });
  return { promise, resolve: (page) => resolvePage(page) };
}

async function seedDestinations(
  destinations: EventDestination[],
): Promise<void> {
  vi.mocked(api.get).mockResolvedValue(makePage(destinations, null));
  renderHook(() => eventDestinationsCollectionUtils.useAll(true));
  await act(() => eventDestinationsCollectionUtils.refetch());
}

function createMutationWrapper(): (props: WrapperProps) => ReactNode {
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  function MutationWrapper({ children }: WrapperProps): ReactNode {
    return createElement(QueryClientProvider, { client }, children);
  }
  return MutationWrapper;
}

function renderListWithCreate() {
  return renderHook(
    () => ({
      all: eventDestinationsCollectionUtils.useAll(true),
      create: eventDestinationsCollectionUtils.useCreateEventDestination({
        onSuccess: () => undefined,
        onError: () => undefined,
      }),
    }),
    { wrapper: createMutationWrapper() },
  );
}

async function failNextLoad(): Promise<void> {
  vi.mocked(api.get).mockRejectedValue(new Error('network down'));
  await act(async () => {
    const failedLoad = eventDestinationsCollectionUtils.refetch();
    await vi.advanceTimersByTimeAsync(QUERY_RETRY_WINDOW_MS);
    await failedLoad;
  });
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

describe('eventDestinationsCollectionUtils.useCreateEventDestination', () => {
  afterEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.useRealTimers();
  });

  it('reloads the list instead of patching it when a destination is created after a failed load', async () => {
    vi.useFakeTimers();
    const { result } = renderListWithCreate();
    await failNextLoad();
    expect(result.current.all.isError).toBe(true);
    vi.useRealTimers();
    vi.mocked(api.post).mockResolvedValue(makeDestination('c2'));
    vi.mocked(api.get).mockResolvedValue(
      makePage([makeDestination('c1'), makeDestination('c2')], null),
    );

    await act(() => result.current.create.mutateAsync(CREATE_REQUEST));

    expect(result.current.all.isError).toBe(false);
    expect(result.current.all.data.map((row) => row.id).sort()).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('keeps reporting the failure when the reload after a create fails too', async () => {
    vi.useFakeTimers();
    const { result } = renderListWithCreate();
    await failNextLoad();
    vi.mocked(api.post).mockResolvedValue(makeDestination('c3'));

    await act(async () => {
      const created = result.current.create.mutateAsync(CREATE_REQUEST);
      await vi.advanceTimersByTimeAsync(QUERY_RETRY_WINDOW_MS);
      await created;
    });

    expect(result.current.all.isError).toBe(true);
    expect(result.current.all.data.map((row) => row.id)).not.toContain('c3');
  });

  it('writes the created destination without a reload when the list is healthy', async () => {
    await seedDestinations([makeDestination('h1')]);
    const { result } = renderListWithCreate();
    const requestsBefore = destinationRequests().length;
    vi.mocked(api.post).mockResolvedValue(makeDestination('h2'));

    await act(() => result.current.create.mutateAsync(CREATE_REQUEST));

    expect(destinationRequests()).toHaveLength(requestsBefore);
    expect(result.current.all.data.map((row) => row.id).sort()).toEqual([
      'h1',
      'h2',
    ]);
  });
});

describe('eventDestinationsCollectionUtils.useFreshDestination', () => {
  afterEach(() => {
    vi.mocked(api.get).mockReset();
    vi.useRealTimers();
  });

  it('waits for a reload before it hands the edit page a destination', async () => {
    await seedDestinations([makeDestination('e1')]);
    const reload = deferredPage();
    vi.mocked(api.get).mockReturnValue(reload.promise);

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e1'),
    );
    expect(result.current.status).toBe('loading');

    reload.resolve(
      makePage(
        [{ ...makeDestination('e1'), url: 'https://example.com/fresh' }],
        null,
      ),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));
    expect(result.current).toEqual({
      status: 'ready',
      destination: expect.objectContaining({
        url: 'https://example.com/fresh',
      }),
    });
  });

  it('reports a failed reload even though a cached row exists', async () => {
    await seedDestinations([makeDestination('e2')]);
    vi.useFakeTimers();
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e2'),
    );
    await act(async () => {
      await vi.advanceTimersByTimeAsync(QUERY_RETRY_WINDOW_MS);
    });

    expect(result.current.status).toBe('error');
  });

  it('reports a destination the reload no longer returns as missing', async () => {
    await seedDestinations([makeDestination('e3')]);
    vi.mocked(api.get).mockResolvedValue(makePage([], null));

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e3'),
    );

    await waitFor(() => expect(result.current.status).toBe('missing'));
  });

  it('keeps an open destination ready when a later reload fails', async () => {
    await seedDestinations([makeDestination('e4')]);
    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e4'),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    vi.useFakeTimers();
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));
    await act(async () => {
      const failedReload = eventDestinationsCollectionUtils.refetch();
      await vi.advanceTimersByTimeAsync(QUERY_RETRY_WINDOW_MS);
      await failedReload;
    });

    expect(result.current.status).toBe('ready');
  });
});

const QUERY_RETRY_WINDOW_MS = 10_000;

const CREATE_REQUEST: CreatePlatformEventDestinationRequestBody = {
  url: 'https://example.com/created',
  events: [ApplicationEventName.FLOW_RUN_FINISHED],
};

type WrapperProps = {
  children: ReactNode;
};

type DeferredPage = {
  promise: Promise<SeekPage<EventDestination>>;
  resolve: (page: SeekPage<EventDestination>) => void;
};
