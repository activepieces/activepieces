// @vitest-environment jsdom
import { tryCatch } from '@activepieces/core-utils';
import type { SeekPage } from '@activepieces/core-utils';
import { ApplicationEventName } from '@activepieces/shared';
import type { EventDestination } from '@activepieces/shared';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createElement, type ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  eventDestinationsCollection,
  eventDestinationsCollectionUtils,
} from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';
import type { SaveEventDestinationParams } from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';
import { api } from '@/lib/api';

import { makeDestination } from '../event-destination-fixtures';

vi.mock('@/lib/api', () => ({
  API_BASE_URL: 'http://localhost',
  api: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}));

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

function renderListWithSave() {
  return renderHook(
    () => ({
      all: eventDestinationsCollectionUtils.useAll(true),
      save: eventDestinationsCollectionUtils.useSaveEventDestination({
        onSuccess: () => undefined,
        onError: () => undefined,
      }),
    }),
    { wrapper: createMutationWrapper() },
  );
}

async function failNextLoad(): Promise<void> {
  vi.mocked(api.get).mockRejectedValue(new Error('network down'));
  await act(() => eventDestinationsCollectionUtils.refetch());
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
    vi.mocked(api.delete).mockReset();
  });

  it('loads every page the server offers, not just the first one', async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce(
        makePage([makeDestination({ id: 'd1' })], 'cursor1'),
      )
      .mockResolvedValueOnce(
        makePage([makeDestination({ id: 'd2' })], 'cursor2'),
      )
      .mockResolvedValueOnce(makePage([makeDestination({ id: 'd3' })], null));

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

  it('reports a failed load at once, and clears it once a retry succeeds', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));
    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useAll(true),
    );

    await act(() => eventDestinationsCollectionUtils.refetch());
    expect(result.current.isError).toBe(true);
    expect(destinationRequests()).toHaveLength(1);

    vi.mocked(api.get).mockResolvedValue(
      makePage([makeDestination({ id: 'd4' })], null),
    );
    await act(() => eventDestinationsCollectionUtils.refetch());
    expect(result.current.isError).toBe(false);
  });

  it('sends only the changed field when a destination is toggled', async () => {
    const stored = makeDestination({
      id: 't1',
      headers: { Authorization: null },
    });
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
      makePage([makeDestination({ id: 't2' })], null),
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

  it('delete rejects and restores the row when the DELETE fails', async () => {
    await seedDestinations([makeDestination({ id: 'x1' })]);
    const failure = new Error('server down');
    vi.mocked(api.delete).mockRejectedValue(failure);

    await expect(eventDestinationsCollectionUtils.delete(['x1'])).rejects.toBe(
      failure,
    );
    expect(eventDestinationsCollection.has('x1')).toBe(true);
  });

  it('delete resolves once the DELETE succeeds', async () => {
    await seedDestinations([makeDestination({ id: 'x2' })]);
    vi.mocked(api.delete).mockResolvedValue(undefined);

    await expect(
      eventDestinationsCollectionUtils.delete(['x2']),
    ).resolves.toBeUndefined();
    expect(api.delete).toHaveBeenCalledWith('/v1/event-destinations/x2');
  });
});

describe('eventDestinationsCollectionUtils.useSaveEventDestination', () => {
  afterEach(() => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
  });

  it('reloads the list instead of patching it when a destination is created after a failed load', async () => {
    const { result } = renderListWithSave();
    await failNextLoad();
    expect(result.current.all.isError).toBe(true);
    vi.mocked(api.post).mockResolvedValue(makeDestination({ id: 'c2' }));
    vi.mocked(api.get).mockResolvedValue(
      makePage(
        [makeDestination({ id: 'c1' }), makeDestination({ id: 'c2' })],
        null,
      ),
    );

    await act(() => result.current.save.mutateAsync(CREATE_PARAMS));

    expect(result.current.all.isError).toBe(false);
    expect(result.current.all.data.map((row) => row.id).sort()).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('keeps reporting the failure when the reload after a create fails too', async () => {
    const { result } = renderListWithSave();
    await failNextLoad();
    vi.mocked(api.post).mockResolvedValue(makeDestination({ id: 'c3' }));

    await act(() => result.current.save.mutateAsync(CREATE_PARAMS));

    expect(result.current.all.isError).toBe(true);
    expect(result.current.all.data.map((row) => row.id)).not.toContain('c3');
  });

  it('writes the created destination without a reload when the list is healthy', async () => {
    await seedDestinations([makeDestination({ id: 'h1' })]);
    const { result } = renderListWithSave();
    const requestsBefore = destinationRequests().length;
    vi.mocked(api.post).mockResolvedValue(makeDestination({ id: 'h2' }));

    await act(() => result.current.save.mutateAsync(CREATE_PARAMS));

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
  });

  it('waits for a reload before it hands the edit page a destination', async () => {
    await seedDestinations([makeDestination({ id: 'e1' })]);
    const reload = deferredPage();
    vi.mocked(api.get).mockReturnValue(reload.promise);

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e1'),
    );
    expect(result.current.status).toBe('loading');

    reload.resolve(
      makePage(
        [makeDestination({ id: 'e1', url: 'https://example.com/fresh' })],
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
    await seedDestinations([makeDestination({ id: 'e2' })]);
    vi.mocked(api.get).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e2'),
    );

    await waitFor(() => expect(result.current.status).toBe('error'));
  });

  it('reports a destination the reload no longer returns as missing', async () => {
    await seedDestinations([makeDestination({ id: 'e3' })]);
    vi.mocked(api.get).mockResolvedValue(makePage([], null));

    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e3'),
    );

    await waitFor(() => expect(result.current.status).toBe('missing'));
  });

  it('keeps an open destination ready when a later reload fails', async () => {
    await seedDestinations([makeDestination({ id: 'e4' })]);
    const { result } = renderHook(() =>
      eventDestinationsCollectionUtils.useFreshDestination('e4'),
    );
    await waitFor(() => expect(result.current.status).toBe('ready'));

    vi.mocked(api.get).mockRejectedValue(new Error('network down'));
    await act(() => eventDestinationsCollectionUtils.refetch());

    expect(result.current.status).toBe('ready');
  });
});

const CREATE_PARAMS: SaveEventDestinationParams = {
  destinationId: null,
  request: {
    url: 'https://example.com/created',
    events: [ApplicationEventName.FLOW_RUN_FINISHED],
  },
};

type WrapperProps = {
  children: ReactNode;
};

type DeferredPage = {
  promise: Promise<SeekPage<EventDestination>>;
  resolve: (page: SeekPage<EventDestination>) => void;
};
