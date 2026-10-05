import { isNil } from '@activepieces/core-utils';
import {
  ACTIVEPIECES_CHAT_TIERS,
  AIProviderAuthConfig,
  AiProviderKeyStatus,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  DEFAULT_CHAT_TIER_ID,
  UpdateAIProviderRequest,
} from '@activepieces/shared';
import {
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';

import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { authenticationSession } from '@/lib/authentication-session';
import { mutationFeedback } from '@/lib/mutation-feedback';

import {
  aiProviderApi,
  ModelTierList,
  ModelTiersResponse,
  ModelTierSurface,
} from '../api/ai-provider-api';

import { aiToolConfigKeys } from './ai-tool-config-hooks';

export const aiProviderKeys = {
  configs: ['ai-provider-configs'] as const,
  modelTiers: ['ai-provider-model-tiers'] as const,
  projectProviders: ['ai-providers'] as const,
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
    }),
  useConfigModels: (configId: string | undefined) =>
    useQuery({
      queryKey: aiProviderKeys.configModels(configId),
      queryFn: () =>
        isNil(configId) ? [] : aiProviderApi.listModelsForConfig(configId),
      enabled: !isNil(configId),
    }),
  useProjectAiProviders: () => {
    const projectId = authenticationSession.getProjectId();
    return useQuery({
      queryKey: aiProviderKeys.forProject(projectId),
      queryFn: () =>
        isNil(projectId) ? [] : aiProviderApi.listForProject(projectId),
      enabled: !isNil(projectId),
    });
  },
  useChatProvider: () => {
    const { data: providers, ...rest } =
      aiProviderQueries.useProjectAiProviders();
    return { ...rest, data: providers?.find((p) => p.enabledForChat) };
  },
  modelTiersOptions: () =>
    queryOptions({
      queryKey: aiProviderKeys.modelTiers,
      queryFn: () => aiProviderApi.listModelTiers(),
      staleTime: MODEL_TIERS_STALE_MS,
      refetchInterval: MODEL_TIERS_STALE_MS,
    }),
  useModelTiers: (surface: ModelTierSurface): ModelTierList => {
    const { data } = useQuery(aiProviderQueries.modelTiersOptions());
    return (data ?? BUNDLED_MODEL_TIERS)[surface];
  },
};

export const aiProviderMutations = {
  useRecheckAiProvider: ({
    onSuccess,
  }: {
    onSuccess: (result: { status: AiProviderKeyStatus }) => void;
  }) => {
    return useMutation({
      mutationFn: (providerId: string) => aiProviderApi.recheck(providerId),
      onSuccess,
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't recheck the key") });
      },
    });
  },
  useDeleteAiProvider: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (providerId: string) => {
        await aiProviderApi.delete(providerId);
        await Promise.all(
          [
            aiProviderKeys.configs,
            aiProviderKeys.projectProviders,
            aiToolConfigKeys.all,
            aiProviderKeys.configModels(),
          ].map((queryKey) => queryClient.invalidateQueries({ queryKey })),
        );
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't delete the key") });
      },
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
  useSetChatProvider: () =>
    useOptimisticMutation<ChatProviderChoice, AIProviderWithoutSensitiveData[]>(
      {
        queryKey: aiProviderKeys.configs,
        scope: 'ai-chat-provider',
        mutationFn: ({ providerId, displayName }) =>
          aiProviderApi.update(providerId, {
            displayName,
            enabledForChat: true,
          }),
        apply: ({ current, vars }) =>
          current.map((provider) => ({
            ...provider,
            enabledForChat: provider.id === vars.providerId,
          })),
        invalidate: [aiProviderKeys.projectProviders],
        success: ({ vars }) =>
          t('{name} now answers in chat', { name: vars.displayName }),
        undo: ({ vars, previous }) => {
          const before = previous?.find((provider) => provider.enabledForChat);
          return before
            ? { providerId: before.id, displayName: before.name }
            : vars;
        },
        errorTitle: t("Couldn't change the chat key"),
      },
    ),
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

const BUNDLED_LIST: ModelTierList = {
  tiers: ACTIVEPIECES_CHAT_TIERS.map(({ id, label, modelId }) => ({
    id,
    label,
    modelId,
  })),
  defaultTierId: DEFAULT_CHAT_TIER_ID,
};

const BUNDLED_MODEL_TIERS: ModelTiersResponse = {
  flow: BUNDLED_LIST,
  chat: BUNDLED_LIST,
};

const MODEL_TIERS_STALE_MS = 15 * 60 * 1000;

type UpsertAiProviderOptions = {
  providerId?: string;
  onSuccess: (created?: AIProviderWithoutSensitiveData) => void;
  onError: (
    error: AxiosError<{ message?: string; params?: { message: string } }>,
  ) => void;
};

export type ChatProviderChoice = {
  providerId: string;
  displayName: string;
};
