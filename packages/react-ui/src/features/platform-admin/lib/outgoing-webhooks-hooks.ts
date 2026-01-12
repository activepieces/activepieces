import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreatePlatformOutgoingWebhookRequestBody,
  TestPlatformOutgoingWebhookRequestBody,
  UpdatePlatformOutgoingWebhookRequestBody,
} from '@activepieces/ee-shared';

import { outgoingWebhooksApi } from './outgoing-webhooks-api';

export const outgoingWebhooksHooks = {
  useOutgoingWebhooks() {
    return useQuery({
      queryKey: ['outgoing-webhooks'],
      queryFn: outgoingWebhooksApi.list,
    });
  },

  useMutateOutgoingWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: ({
        id,
        data,
      }: {
        id?: string;
        data:
          | UpdatePlatformOutgoingWebhookRequestBody
          | CreatePlatformOutgoingWebhookRequestBody;
      }) => {
        if (id) {
          return outgoingWebhooksApi.update(
            id,
            data as UpdatePlatformOutgoingWebhookRequestBody,
          );
        } else {
          return outgoingWebhooksApi.create(
            data as CreatePlatformOutgoingWebhookRequestBody,
          );
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['outgoing-webhooks'] });
      },
    });
  },

  useDeleteOutgoingWebhook() {
    const queryClient = useQueryClient();

    return useMutation({
      mutationFn: (id: string) => outgoingWebhooksApi.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['outgoing-webhooks'] });
      },
    });
  },

  useTestOutgoingWebhook() {
    return useMutation({
      mutationFn: (request: TestPlatformOutgoingWebhookRequestBody) =>
        outgoingWebhooksApi.test(request),
    });
  },
};
