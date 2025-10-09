import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
  CreateOutgoingWebhookRequestBody,
  TestOutgoingWebhookRequestBody,
  UpdateOutgoingWebhookRequestBody,
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
        data: CreateOutgoingWebhookRequestBody;
      }) => {
        if (id) {
          return outgoingWebhooksApi.update(
            id,
            data,
          );
        } else {
          return outgoingWebhooksApi.create(
            data,
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
      mutationFn: (request: TestOutgoingWebhookRequestBody) =>
        outgoingWebhooksApi.test(request),
    });
  },
};
