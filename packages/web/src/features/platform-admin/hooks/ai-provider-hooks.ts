import { isNil } from '@activepieces/core-utils';
import {
  AIProviderAuthConfig,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { authenticationSession } from '@/lib/authentication-session';

import { aiProviderApi } from '../api/ai-provider-api';

export const aiProviderKeys = {
  configs: ['ai-provider-configs'] as const,
  forProject: (projectId: string | null) =>
    ['ai-providers', projectId] as const,
  configModels: (configId?: string) =>
    configId === undefined
      ? (['ai-provider-config-models'] as const)
      : (['ai-provider-config-models', configId] as const),
};

export const aiProviderQueries = {
  useAiProviderConfigs: () =>
    useQuery({
      queryKey: aiProviderKeys.configs,
      queryFn: () => aiProviderApi.listConfigs(),
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
    }),
  useProjectAiProviders: (forProjectId?: string) => {
    const projectId = forProjectId ?? authenticationSession.getProjectId();
    return useQuery({
      queryKey: aiProviderKeys.forProject(projectId),
      queryFn: () =>
        isNil(projectId) ? [] : aiProviderApi.listForProject(projectId),
      enabled: !isNil(projectId),
    });
  },
  useChatProvider: (forProjectId?: string) => {
    const { data: providers, ...rest } =
      aiProviderQueries.useProjectAiProviders(forProjectId);
    return { ...rest, data: providers?.find((p) => p.enabledForChat) };
  },
};

export const aiProviderMutations = {
  useRecheckAiProvider: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (providerId: string) => aiProviderApi.recheck(providerId),
      onSuccess,
    });
  },
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
