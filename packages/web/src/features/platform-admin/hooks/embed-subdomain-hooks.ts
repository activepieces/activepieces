import {
  ApEdition,
  ApFlagId,
  EmbedSubdomain,
  EmbedSubdomainStatus,
  GenerateEmbedSubdomainRequest,
  PlatformWithoutSensitiveData,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';
import { toast } from 'sonner';

import { platformApi } from '@/api/platforms-api';
import { flagsHooks } from '@/hooks/flags-hooks';
import { platformHooks } from '@/hooks/platform-hooks';
import { useOptimisticMutation } from '@/hooks/use-optimistic-mutation';
import { authenticationSession } from '@/lib/authentication-session';

import { embedSubdomainApi } from '../api/embed-subdomain-api';

import { ListChange, platformListChange } from './sso-hooks';

export const embedSubdomainKeys = {
  current: ['embed-subdomain'] as const,
};

export const embedSubdomainQueries = {
  useEmbedSubdomain: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    const { data: edition } = flagsHooks.useFlag<ApEdition>(ApFlagId.EDITION);
    return useQuery<EmbedSubdomain | null>({
      queryKey: embedSubdomainKeys.current,
      queryFn: () => embedSubdomainApi.get(),
      enabled: platform.plan.embeddingEnabled && edition === ApEdition.CLOUD,
      refetchInterval: (query) => {
        const data = query.state.data;
        if (data?.status === EmbedSubdomainStatus.PENDING_VERIFICATION) {
          return 10000;
        }
        return false;
      },
    });
  },
  useCurrentEmbedSubdomain: () => {
    const { data, isLoading, isError, refetch } =
      embedSubdomainQueries.useEmbedSubdomain();
    return { subdomain: data ?? undefined, isLoading, isError, refetch };
  },
};

export const embedSubdomainMutations = {
  useUpsert: ({ onError }: { onError: (error: Error) => void }) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async ({ request }: EmbedSubdomainUpsert) => {
        const saved = await embedSubdomainApi.upsert(request);
        await queryClient.invalidateQueries({
          queryKey: embedSubdomainKeys.current,
        });
        return saved;
      },
      onSuccess: (_saved, { replacing }) => {
        toast.success(replacing ? t('Domain updated') : t('Domain saved'));
      },
      onError,
    });
  },
  useAllowedOrigins: () => {
    const queryClient = useQueryClient();
    const queryKey = ['platform', authenticationSession.getPlatformId()];
    return useOptimisticMutation<
      ListChange,
      PlatformWithoutSensitiveData,
      PlatformWithoutSensitiveData
    >({
      queryKey,
      scope: 'platform-allowed-embed-origins',
      mutationFn: (change) =>
        platformApi.update(
          {
            allowedEmbedOrigins: platformListChange.apply({
              list:
                queryClient.getQueryData<PlatformWithoutSensitiveData>(queryKey)
                  ?.allowedEmbedOrigins ?? [],
              change,
            }),
          },
          authenticationSession.getPlatformId()!,
        ),
      apply: ({ current, vars }) => ({
        ...current,
        allowedEmbedOrigins: platformListChange.apply({
          list: current.allowedEmbedOrigins ?? [],
          change: vars,
        }),
      }),
      success: ({ vars }) =>
        vars.type === 'add'
          ? t('{value} added', { value: vars.value })
          : t('{value} removed', { value: vars.value }),
      undo: ({ vars }) => platformListChange.invert(vars),
      errorTitle: t("Couldn't update allowed websites"),
    });
  },
};

type EmbedSubdomainUpsert = {
  request: GenerateEmbedSubdomainRequest;
  replacing: boolean;
};
