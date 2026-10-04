// @vitest-environment jsdom
import {
  ApplicationEventName,
  EventDestination,
  EventDestinationFormat,
  EventDestinationScope,
} from '@activepieces/shared';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { apiMock } = vi.hoisted(() => ({
  apiMock: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock('@/lib/api', () => ({ api: apiMock }));
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
  enabled: true,
  headers: {},
  format: EventDestinationFormat.RAW,
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

  it('update rejects and rolls back when the POST fails', async () => {
    apiMock.post.mockRejectedValue(serverError);

    const transaction = eventDestinationsCollectionUtils.update({
      destinationId: destination.id,
      request: { url: 'https://new.example.com/hook' },
    });

    await expect(transaction.isPersisted.promise).rejects.toBe(serverError);
    expect(eventDestinationsCollection.get(destination.id)?.url).toBe(
      destination.url,
    );
  });

  it('update resolves once the POST succeeds', async () => {
    apiMock.post.mockResolvedValue({
      ...destination,
      url: 'https://new.example.com/hook',
    });

    const transaction = eventDestinationsCollectionUtils.update({
      destinationId: destination.id,
      request: { url: 'https://new.example.com/hook' },
    });

    await expect(transaction.isPersisted.promise).resolves.toBeDefined();
    expect(apiMock.post).toHaveBeenCalledWith(
      `/v1/event-destinations/${destination.id}`,
      { url: 'https://new.example.com/hook' },
    );
  });

  it('delete rejects and restores the row when the DELETE fails', async () => {
    apiMock.delete.mockRejectedValue(serverError);

    await expect(
      eventDestinationsCollectionUtils.delete([destination.id]),
    ).rejects.toBe(serverError);
    expect(eventDestinationsCollection.has(destination.id)).toBe(true);
  });

  it('delete resolves once the DELETE succeeds', async () => {
    apiMock.delete.mockResolvedValue(undefined);

    await expect(
      eventDestinationsCollectionUtils.delete([destination.id]),
    ).resolves.toBeUndefined();
    expect(apiMock.delete).toHaveBeenCalledWith(
      `/v1/event-destinations/${destination.id}`,
    );
  });
});
