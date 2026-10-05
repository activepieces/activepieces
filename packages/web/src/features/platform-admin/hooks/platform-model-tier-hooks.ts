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
import { useCallback, useMemo } from 'react';

import { platformConfigurationApi } from '@/api/platform-configuration-api';
import {
  KeyModelsById,
  modelMeta,
} from '@/features/agents/ai-model/model-meta';
import { platformConfigurationHooks } from '@/hooks/platform-configuration-hooks';

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
  useCreate: () => {
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
      },
      onError: () => undefined,
      onSettled: () => settle({ queryClient }),
    });
  },
  useUpdate: () => {
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
      },
      onError: (_error, _variables, context) => {
        restore({ queryClient, previous: context?.previous });
      },
      onSettled: () => settle({ queryClient }),
    });
  },
  useReorder: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: (tierIds: string[]) =>
        platformModelTierApi.reorder({ tierIds }),
      onMutate: async (tierIds) => {
        await queryClient.cancelQueries({
          queryKey: platformModelTierKeys.admin,
        });
        const previous = queryClient.getQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
        );
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => old && reorderTiers({ tiers: old, tierIds }),
        );
        return { previous };
      },
      onSuccess: (reordered) => {
        queryClient.setQueryData(platformModelTierKeys.admin, reordered);
      },
      onError: (_error, _variables, context) => {
        restore({ queryClient, previous: context?.previous });
      },
      onSettled: () => settle({ queryClient }),
    });
  },
  useDelete: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationKey: platformModelTierKeys.admin,
      mutationFn: ({ id, replacedBy }: { id: string; replacedBy?: string }) =>
        platformModelTierApi.remove({ id, replacedBy }),
      onSuccess: (_result, { id, replacedBy }) => {
        queryClient.setQueryData<PlatformModelTier[]>(
          platformModelTierKeys.admin,
          (old) => old && removeTier({ tiers: old, id, replacedBy }),
        );
      },
      onError: () => undefined,
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

function reorderTiers({
  tiers,
  tierIds,
}: {
  tiers: PlatformModelTier[];
  tierIds: string[];
}): PlatformModelTier[] {
  const byId = new Map(tiers.map((tier) => [tier.id, tier]));
  return tierIds.flatMap((id, position) => {
    const tier = byId.get(id);
    return tier === undefined ? [] : [{ ...tier, position }];
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

type KeyModelsQueryResult = {
  data:
    | Awaited<ReturnType<typeof aiProviderApi.listModelsForConfig>>
    | undefined;
  isLoading: boolean;
  isError: boolean;
  refetch: () => unknown;
};
