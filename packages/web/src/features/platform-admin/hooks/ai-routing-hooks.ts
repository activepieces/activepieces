import { UpsertAiRoutingRequest } from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { aiRoutingApi } from '../api/ai-routing-api';

export const aiRoutingKeys = {
  all: ['ai-routing'] as const,
};

export const aiRoutingQueries = {
  useAiRouting: () =>
    useQuery({
      queryKey: aiRoutingKeys.all,
      queryFn: () => aiRoutingApi.get(),
    }),
};

export const aiRoutingMutations = {
  useUpsertAiRouting: ({ onSuccess, onError }: AiRoutingMutationOptions) =>
    useMutation({
      mutationFn: (request: UpsertAiRoutingRequest) =>
        aiRoutingApi.upsert(request),
      onSuccess,
      onError,
    }),
  useResetAiRouting: ({ onSuccess, onError }: AiRoutingMutationOptions) =>
    useMutation({
      mutationFn: () => aiRoutingApi.reset(),
      onSuccess,
      onError,
    }),
};

type AiRoutingMutationOptions = {
  onSuccess: () => void;
  onError?: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};
