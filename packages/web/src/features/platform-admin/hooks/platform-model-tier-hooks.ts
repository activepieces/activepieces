import {
  AIProviderWithoutSensitiveData,
  CreatePlatformModelTierRequest,
  PlatformConfiguration,
  PlatformModelTier,
  UpdatePlatformModelTierRequest,
} from '@activepieces/shared';
import {
  QueryClient,
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { t } from 'i18next';
import { useCallback, useMemo } from 'react';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { aiProviderApi } from '../api/ai-provider-api';
import { platformModelTierApi } from '../api/platform-model-tier-api';

import { aiProviderKeys } from './ai-provider-hooks';

export const platformModelTierKeys = {
  admin: ['platform-model-tiers', 'admin'] as const,
};

export const platformModelTierQueries = {
  useAdminList: () =>
    useQuery({
      queryKey: platformModelTierKeys.admin,
      queryFn: () => platformModelTierApi.listAdmin(),
      staleTime: TIERS_STALE_MS,
    }),
  useKeyModels: (configs: AIProviderWithoutSensitiveData[]): KeyModelsById => {
    const ownKeys = useMemo(
      () => configs.filter(modelMeta.isOwnKey),
      [configs],
    );
    const combine = useCallback(
      (results: KeyModelsQueryResult[]): KeyModelsById =>
        Object.fromEntries(
          ownKeys.map((config, index) => [
            config.id,
            {
              models:
                results[index].data === undefined
                  ? undefined
                  : modelMeta.scopedTextModels({
                      config,
                      models: results[index].data,
                    }),
              isLoading: results[index].isLoading,
              isFetching: results[index].isFetching,
              isError: results[index].isError,
              refetch: results[index].refetch,
            },
          ]),
        ),
      [ownKeys],
    );
    return useQueries({
      queries: ownKeys.map((config) => ({
        queryKey: aiProviderKeys.configModels(config.id),
        queryFn: () => aiProviderApi.listModelsForConfig(config.id),
        staleTime: KEY_MODELS_STALE_MS,
      })),
      combine,
    });
  },
};

export const platformModelTierMutations = {
  useCreate: ({ feedback = 'toast' }: TierMutationOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: (request: CreatePlatformModelTierRequest) =>
        platformModelTierApi.create(request),
      onSuccess: (created) => {
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => upsertTier({ tiers: old ?? [], tier: created }),
        );
        announce({
          feedback,
          message: t('{name} created', { name: created.name }),
        });
      },
      onError: (error, request) =>
        reportError({
          feedback,
          error,
          title: t("Couldn't create {name}", { name: request.name }),
        }),
      onSettled: () => settle({ queryClient }),
    });
  },
  useUpdate: ({ feedback = 'toast' }: TierMutationOptions = {}) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: ({
        id,
        request,
      }: {
        id: string;
        request: UpdatePlatformModelTierRequest;
      }) => platformModelTierApi.update({ id, request }),
      onMutate: async ({ id, request }) => {
        await queryClient.cancelQueries({
          queryKey: platformModelTierKeys.admin,
        });
        const previous = queryClient.getQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
        );
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => old && applyPatch({ tiers: old, id, request }),
        );
        return { previous };
      },
      onSuccess: (updated) => {
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => upsertTier({ tiers: old ?? [], tier: updated }),
        );
        announce({
          feedback,
          message: t('{name} updated', { name: updated.name }),
        });
      },
      onError: (error, { id }, context) => {
        restore({ queryClient, previous: context?.previous });
        reportError({
          feedback,
          error,
          title: t("Couldn't update {name}", {
            name: tierName({ tiers: context?.previous, id }),
          }),
        });
      },
      onSettled: () => settle({ queryClient }),
    });
  },
  useReorder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: ({ tierIds }: { tierIds: string[] }) =>
        platformModelTierApi.reorder({ tierIds }),
      onMutate: async ({ tierIds }) => {
        await queryClient.cancelQueries({
          queryKey: platformModelTierKeys.admin,
        });
        const previous = queryClient.getQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
        );
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) =>
            old &&
            tierIds.flatMap((id) => old.filter((tier) => tier.id === id)),
        );
        return { previous };
      },
      onSuccess: (tiers) => {
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          tiers,
        );
        mutationFeedback.success(t('Changes saved'));
      },
      onError: (error, _variables, context) => {
        restore({ queryClient, previous: context?.previous });
        mutationFeedback.error({ error, title: t("Couldn't save changes") });
      },
      onSettled: () => settle({ queryClient }),
    });
  },
  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: ({
        id,
        replacedBy,
      }: {
        id: string;
        name: string;
        replacedBy?: string;
      }) => platformModelTierApi.remove({ id, replacedBy }),
      onSuccess: (_result, { id, name, replacedBy }) => {
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => old && removeTier({ tiers: old, id, replacedBy }),
        );
        mutationFeedback.success(t('{name} deleted', { name }));
      },
      onError: (error, { name }) =>
        mutationFeedback.error({
          error,
          title: t("Couldn't delete {name}", { name }),
        }),
      onSettled: () => settle({ queryClient }),
    });
  },
  useSetSpecificModelsVisible: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (visible: boolean) =>
        platformConfigurationApi.update({ aiSpecificModelsVisible: visible }),
      onMutate: async (visible) => {
        await queryClient.cancelQueries({
          queryKey: platformConfigurationHooks.queryKey,
        });
        const previous = queryClient.getQueryData<PlatformConfiguration>(
          platformConfigurationHooks.queryKey,
        );
        queryClient.setQueryData<PlatformConfiguration>(
          platformConfigurationHooks.queryKey,
          (old) => old && { ...old, aiSpecificModelsVisible: visible },
        );
        return { previous };
      },
      onSuccess: (configuration) => {
        queryClient.setQueryData(
          platformConfigurationHooks.queryKey,
          configuration,
        );
      },
      onError: (_error, _variables, context) => {
        if (context?.previous !== undefined) {
          queryClient.setQueryData(
            platformConfigurationHooks.queryKey,
            context.previous,
          );
        }
      },
    });
  },
};

function announce({
  feedback,
  message,
}: {
  feedback: TierMutationFeedback;
  message: string;
}): void {
  if (feedback !== 'errorsOnly') {
    mutationFeedback.success(message);
  }
}

function reportError({
  feedback,
  error,
  title,
}: {
  feedback: TierMutationFeedback;
  error: unknown;
  title: string;
}): void {
  if (feedback === 'inline') {
    mutationFeedback.markShown(error);
    return;
  }
  mutationFeedback.error({ error, title });
}

function tierName({
  tiers,
  id,
}: {
  tiers: PlatformModelTier[] | undefined;
  id: string;
}): string {
  return tiers?.find((tier) => tier.id === id)?.name ?? t('this tier');
}

function settle({ queryClient }: { queryClient: QueryClient }): void {
  if (
    queryClient.isMutating({ mutationKey: platformModelTierKeys.admin }) === 1
  ) {
    queryClient.invalidateQueries({ queryKey: platformModelTierKeys.admin });
  }
}

function restore({
  queryClient,
  previous,
}: {
  queryClient: QueryClient;
  previous: PlatformModelTier[] | undefined;
}): void {
  if (previous !== undefined) {
    queryClient.setQueryData(platformModelTierKeys.admin, previous);
  }
}

function upsertTier({
  tiers,
  tier,
}: {
  tiers: PlatformModelTier[];
  tier: PlatformModelTier;
}): PlatformModelTier[] {
  const exists = tiers.some((candidate) => candidate.id === tier.id);
  const merged = exists
    ? tiers.map((candidate) => (candidate.id === tier.id ? tier : candidate))
    : [...tiers, tier];
  return merged.map((candidate) =>
    candidate.id === tier.id
      ? candidate
      : {
          ...candidate,
          isDefault: tier.isDefault ? false : candidate.isDefault,
          isFast: tier.isFast ? false : candidate.isFast,
        },
  );
}

function applyPatch({
  tiers,
  id,
  request,
}: {
  tiers: PlatformModelTier[];
  id: string;
  request: UpdatePlatformModelTierRequest;
}): PlatformModelTier[] {
  return tiers.map((tier) => {
    if (tier.id === id) {
      return {
        ...tier,
        ...(request.name === undefined ? {} : { name: request.name }),
        ...(request.emoji === undefined ? {} : { emoji: request.emoji }),
        ...(request.description === undefined
          ? {}
          : { description: request.description }),
        ...(request.entries === undefined ? {} : { entries: request.entries }),
        ...(request.thinkingBudget === undefined
          ? {}
          : { thinkingBudget: request.thinkingBudget }),
        ...(request.isDefault === true ? { isDefault: true } : {}),
        ...(request.isFast === true ? { isFast: true } : {}),
      };
    }
    return {
      ...tier,
      isDefault: request.isDefault === true ? false : tier.isDefault,
      isFast: request.isFast === true ? false : tier.isFast,
    };
  });
}

function removeTier({
  tiers,
  id,
  replacedBy,
}: {
  tiers: PlatformModelTier[];
  id: string;
  replacedBy: string | undefined;
}): PlatformModelTier[] {
  const removed = tiers.find((tier) => tier.id === id);
  return tiers
    .filter((tier) => tier.id !== id)
    .map((tier) =>
      tier.id === replacedBy && removed !== undefined
        ? {
            ...tier,
            isDefault: tier.isDefault || removed.isDefault,
            isFast: tier.isFast || removed.isFast,
          }
        : tier,
    );
}

const TIERS_STALE_MS = 30 * 1000;
const KEY_MODELS_STALE_MS = 5 * 60 * 1000;

type TierMutationFeedback = 'toast' | 'inline' | 'errorsOnly';

type TierMutationOptions = { feedback?: TierMutationFeedback };

type KeyModelsQueryResult = {
  data:
    | Awaited<ReturnType<typeof aiProviderApi.listModelsForConfig>>
    | undefined;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  refetch: () => unknown;
};
