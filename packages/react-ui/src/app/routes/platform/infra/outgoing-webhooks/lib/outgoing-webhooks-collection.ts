import { queryCollectionOptions } from '@tanstack/query-db-collection';
import {
  createCollection,
  useLiveQuery,
} from '@tanstack/react-db';
import { QueryClient, useMutation } from '@tanstack/react-query';

import { api } from '@/lib/api';
import {
  CreatePlatformOutgoingWebhookRequestBody,
  OutgoingWebhook,
  TestPlatformOutgoingWebhookRequestBody,
  UpdatePlatformOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';
import { SeekPage } from '@activepieces/shared';

const collectionQueryClient = new QueryClient();

export const outgoingWebhooksCollection = createCollection<OutgoingWebhook, string>(
  queryCollectionOptions({
    queryKey: ['outgoing-webhooks'],
    queryClient: collectionQueryClient,
    queryFn: async () => {
      const response = await api.get<SeekPage<OutgoingWebhook>>(
        '/v1/outgoing-webhooks',
      );
      return response.data;
    },
    getKey: (item) => item.id,
    onUpdate: async ({ transaction }) => {
      for (const { original, modified } of transaction.mutations) {
        const request: UpdatePlatformOutgoingWebhookRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.patch<OutgoingWebhook>(
          `/v1/outgoing-webhooks/${original.id}`,
          request,
        );
      }
    },
    onInsert: async ({ transaction }) => {
      for (const { modified } of transaction.mutations) {
        const request: CreatePlatformOutgoingWebhookRequestBody = {
          url: modified.url,
          events: modified.events,
        };
        await api.post<OutgoingWebhook>('/v1/outgoing-webhooks', request);
      }
    },
    onDelete: async ({ transaction }) => {
      for (const { original } of transaction.mutations) {
        await api.delete<void>(`/v1/outgoing-webhooks/${original.id}`);
      }
    },
  }),
);

export const outgoingWebhooksCollectionUtils = {
  useAll: (enabled: boolean) => {
    if (!enabled) {
      return {
        data: [],
        isLoading: false,
        isError: false,
        isSuccess: true,
      };
    }
    return useLiveQuery(
      (q) =>
        q
          .from({ webhook: outgoingWebhooksCollection })
          .select(({ webhook }) => ({ ...webhook })),
      [],
    );
  },

  useCreateOutgoingWebhook: (
    onSuccess: (webhook: OutgoingWebhook) => void,
    onError: (error: Error) => void,
  ) => {
    return useMutation({
      mutationFn: (request: CreatePlatformOutgoingWebhookRequestBody) =>
        api.post<OutgoingWebhook>('/v1/outgoing-webhooks', request),
      onSuccess: (data) => {
        outgoingWebhooksCollection.utils.writeInsert(data);
        onSuccess(data);
      },
      onError: (error) => {
        onError(error);
      },
    });
  },

  update: (webhookId: string, request: UpdatePlatformOutgoingWebhookRequestBody) => {
    outgoingWebhooksCollection.update(webhookId, (draft) => {
      Object.assign(
        draft,
        Object.fromEntries(
          Object.entries(request).filter(([_, value]) => value !== undefined),
        ),
      );
    });
  },

  delete: (webhookIds: string[]) => {
    outgoingWebhooksCollection.delete(webhookIds);
  },

  useTestOutgoingWebhook: () => {
    return useMutation({
      mutationFn: (request: TestPlatformOutgoingWebhookRequestBody) =>
        api.post<void>(`/v1/outgoing-webhooks/test`, request),
    });
  },
};

