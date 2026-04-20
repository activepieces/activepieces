import {
  AIProviderAuthConfig,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { aiProviderApi } from '../api/ai-provider-api';

export const aiProviderKeys = {
  all: ['ai-providers'] as const,
};

export const aiProviderQueries = {
  useAiProviders: () =>
    useQuery({
      queryKey: aiProviderKeys.all,
      queryFn: () => aiProviderApi.list(),
    }),
};

export const aiProviderMutations = {
  useDeleteAiProvider: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (provider: string) => aiProviderApi.delete(provider),
      onSuccess,
    });
  },
  useUpsertAiProvider: ({
    providerId,
    onSuccess,
    onError,
  }: UpsertAiProviderOptions) => {
    return useMutation({
      mutationFn: (data: CreateAIProviderRequest): Promise<void> => {
        if (providerId) {
          const updateData: UpdateAIProviderRequest = {
            displayName: data.displayName,
            config: data.config,
            ...(hasAnyAuthFieldFilled(data.auth) ? { auth: data.auth } : {}),
          };
          return aiProviderApi.update(providerId, updateData);
        } else {
          return aiProviderApi.upsert(data);
        }
      },
      onSuccess,
      onError,
    });
  },
};

const hasAnyAuthFieldFilled = (
  auth: AIProviderAuthConfig | undefined,
): boolean => {
  if (!auth) {
    return false;
  }
  return Object.values(auth).some(
    (value) => typeof value === 'string' && value.length > 0,
  );
};

type UpsertAiProviderOptions = {
  providerId?: string;
  onSuccess: () => void;
  onError: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};
