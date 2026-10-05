// @vitest-environment jsdom
import {
  ApplicationEventName,
  EventDestination,
  EventDestinationScope,
} from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock, toastMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    isError: () => false,
    serverErrorMessage: () => undefined,
    extractServerErrorMessage: (error: unknown, fallback: string) =>
      error instanceof Error ? error.message : fallback,
  },
  toastMock: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/api', () => ({ api: apiMock }));
vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: toastMock }));
vi.mock('@/features/flows', () => ({
  flowHooks: {},
  flowsApi: {},
  triggerEventsApi: {},
}));
vi.mock('@/features/projects', () => ({ projectCollectionUtils: {} }));
vi.mock('@/hooks/user-hooks', () => ({ userHooks: {} }));

import {
  eventDestinationsCollection,
  eventDestinationsCollectionUtils,
} from '@/app/routes/platform/infra/event-destinations/lib/event-destinations-collection';

const destination: EventDestination = {
  id: 'dest1',
  created: '2026-01-01T00:00:00.000Z',
  updated: '2026-01-01T00:00:00.000Z',
  platformId: 'platform1',
  scope: EventDestinationScope.PLATFORM,
  events: [ApplicationEventName.FLOW_CREATED],
  url: 'https://old.example.com/hook',
};

const serverError = new Error('Request failed with status code 500');

describe('eventDestinationsCollectionUtils', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    apiMock.get.mockResolvedValue({
      data: [destination],
      next: null,
      previous: null,
    });
    await eventDestinationsCollection.utils.refetch();
    await eventDestinationsCollection.toArrayWhenReady();
  });

  it('update rejects and rolls back when the PATCH fails', async () => {
    apiMock.patch.mockRejectedValue(serverError);

    const transaction = eventDestinationsCollectionUtils.update(
      destination.id,
      { url: 'https://new.example.com/hook', events: destination.events },
    );

    await expect(transaction.isPersisted.promise).rejects.toBe(serverError);
    expect(eventDestinationsCollection.get(destination.id)?.url).toBe(
      destination.url,
    );
  });

  it('update resolves once the PATCH succeeds', async () => {
    apiMock.patch.mockResolvedValue({
      ...destination,
      url: 'https://new.example.com/hook',
    });

    const transaction = eventDestinationsCollectionUtils.update(
      destination.id,
      { url: 'https://new.example.com/hook', events: destination.events },
    );

    await expect(transaction.isPersisted.promise).resolves.toBeDefined();
    expect(apiMock.patch).toHaveBeenCalledWith(
      `/v1/event-destinations/${destination.id}`,
      { url: 'https://new.example.com/hook', events: destination.events },
    );
  });

  it('delete rejects and restores the row when the DELETE fails', async () => {
    apiMock.delete.mockRejectedValue(serverError);

    const transaction = eventDestinationsCollectionUtils.delete([
      destination.id,
    ]);

    await expect(transaction.isPersisted.promise).rejects.toBe(serverError);
    expect(eventDestinationsCollection.has(destination.id)).toBe(true);
  });

  it('delete resolves once the DELETE succeeds', async () => {
    apiMock.delete.mockResolvedValue(undefined);

    const transaction = eventDestinationsCollectionUtils.delete([
      destination.id,
    ]);

    await expect(transaction.isPersisted.promise).resolves.toBeDefined();
    expect(apiMock.delete).toHaveBeenCalledWith(
      `/v1/event-destinations/${destination.id}`,
    );
  });

  it('deleteWithUndo removes the row and offers an undo that recreates it', async () => {
    apiMock.delete.mockResolvedValue(undefined);
    apiMock.get.mockResolvedValue({ data: [], next: null, previous: null });
    apiMock.post.mockResolvedValue({ ...destination, id: 'dest2' });

    await eventDestinationsCollectionUtils.deleteWithUndo(destination);

    expect(eventDestinationsCollection.has(destination.id)).toBe(false);
    expect(toastMock.error).not.toHaveBeenCalled();
    const [message, options] = toastMock.success.mock.calls[0];
    expect(message).toBe('Destination deleted');
    expect(options.action.label).toBe('Undo');

    options.action.onClick();
    await vi.waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith('Undone'),
    );
    expect(apiMock.post).toHaveBeenCalledWith('/v1/event-destinations', {
      url: destination.url,
      events: destination.events,
    });
    expect(eventDestinationsCollection.has('dest2')).toBe(true);
  });

  it('deleteWithUndo restores the row and shows one error when the DELETE fails', async () => {
    apiMock.delete.mockRejectedValue(serverError);

    await eventDestinationsCollectionUtils.deleteWithUndo(destination);

    expect(eventDestinationsCollection.has(destination.id)).toBe(true);
    expect(toastMock.success).not.toHaveBeenCalled();
    expect(toastMock.error).toHaveBeenCalledTimes(1);
    expect(toastMock.error).toHaveBeenCalledWith(
      "Couldn't delete the destination",
      expect.objectContaining({ description: serverError.message }),
    );
  });
});
