import { queryCollectionOptions } from '@tanstack/query-db-collection';
import { createCollection, useLiveQuery } from '@tanstack/react-db';
import { QueryClient, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import {
  CreatePlatformEventDestinationRequestBody,
  EventDestination,
  TestPlatformEventDestinationRequestBody,
  UpdatePlatformEventDestinationRequestBody,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

const collectionQueryClient = new QueryClient();

export const eventDestinationsCollection = createCollection<
  EventDestination,
  string
>(
  queryCollectionOptions({
    queryKey: ['event-destinations'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const response = await api.get<SeekPage<EventDestination>>(
        '/v1/event-destinations',
      );
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        const request: UpdatePlatformEventDestinationRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.patch<EventDestination>(
          `/v1/event-destinations/${original.id}`,
          request,
        );
      }
    },
    onInsert: async ({ transaction }) => {
      for (const { modified } of transaction.mutations) {
        const request: CreatePlatformEventDestinationRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.post<EventDestination>('/v1/event-destinations', request);
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await api.delete<void>(`/v1/event-destinations/${original.id}`);
      }
    },
  }),
);

export const eventDestinationsCollectionUtils = {
  useAll: (enabled: boolean) => {
    const queryResult = useLiveQuery(
      (q) =>
        q
          .from({ destination: eventDestinationsCollection })
          .select(({ destination }) => ({ ...destination })),
      [],
    );
    if (!enabled) {
      return {
        data: [],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
    }
    return queryResult;
  },

  useCreateEventDestination: (
    onSuccess: (destination: EventDestination) => void,
    onError: (error: Error) => void,
  ) => {
    return useMutation({
      mutationFn: (request: CreatePlatformEventDestinationRequestBody) =>
        api.post<EventDestination>('/v1/event-destinations', request),
      onSuccess: (data) => {
        eventDestinationsCollection.utils.writeInsert(data);
        onSuccess(data);
      },
      onError: (error) => {
        onError(error);
      },
    });
  },

  update: (
    destinationId: string,
    request: UpdatePlatformEventDestinationRequestBody,
  ) => {
    eventDestinationsCollection.update(destinationId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    });
  },

  delete: (destinationIds: string[]) => {
    eventDestinationsCollection.delete(destinationIds);
  },

  useTestEventDestination: () => {
    return useMutation({
      mutationFn: (request: TestPlatformEventDestinationRequestBody) =>
        api.post<void>(`/v1/event-destinations/test`, request),
    });
  },
};
