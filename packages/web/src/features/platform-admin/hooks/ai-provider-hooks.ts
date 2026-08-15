import {
  AIProviderAuthConfig,
  AIProviderWithoutSensitiveData,
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
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }),
  useChatProvider: () => {
    const { data: providers, ...rest } = aiProviderQueries.useAiProviders();
    return { ...rest, data: providers?.find((p) => p.enabledForChat) };
  },
};

export const aiProviderMutations = {
  useDeleteAiProvider: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (providerId: string) => aiProviderApi.delete(providerId),
      onSuccess,
    });
  },
  useUpdateAiProvider: ({
    onSuccess,
    onError,
  }: {
    onSuccess: () => void;
    onError?: (
      error: AxiosError<{ message?: string; params?: { message: string } }>,
    ) => void;
  }) => {
    return useMutation({
      mutationFn: ({
        providerId,
        request,
      }: {
        providerId: string;
        request: UpdateAIProviderRequest;
      }) => aiProviderApi.update(providerId, request),
      onSuccess,
      onError,
    });
  },
  useToggleChatProvider: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: ({
        providerId,
        displayName,
      }: {
        providerId: string;
        displayName: string;
      }) =>
        aiProviderApi.update(providerId, { displayName, enabledForChat: true }),
      onSuccess,
    });
  },
  useUpsertAiProvider: ({
    providerId,
    onSuccess,
    onError,
  }: UpsertAiProviderOptions) => {
    return useMutation({
      mutationFn: async (
        data: CreateAIProviderRequest,
      ): Promise<AIProviderWithoutSensitiveData | undefined> => {
        if (providerId) {
          const updateData: UpdateAIProviderRequest = {
            displayName: data.displayName,
            config: data.config,
            ...(hasAnyAuthFieldFilled(data.auth) ? { auth: data.auth } : {}),
          };
          await aiProviderApi.update(providerId, updateData);
          return undefined;
        }
        return aiProviderApi.upsert(data);
      },
      onSuccess,
      onError,
    });
  },
};

export const hasAnyAuthFieldFilled = (
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
  onSuccess: (created?: AIProviderWithoutSensitiveData) => void;
  onError: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};
