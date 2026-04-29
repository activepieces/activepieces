import {
  EmbedSubdomain,
  EmbedSubdomainStatus,
  GenerateEmbedSubdomainRequest,
  UpdateEmbedSubdomainAllowedDomainsRequest,
} from '@activepieces/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { platformHooks } from '@/hooks/platform-hooks';

import { embedSubdomainApi } from '../api/embed-subdomain-api';

export const embedSubdomainKeys = {
  current: ['embed-subdomain'] as const,
};

export const embedSubdomainQueries = {
  useEmbedSubdomain: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery<EmbedSubdomain | null>({
      queryKey: embedSubdomainKeys.current,
      queryFn: () => embedSubdomainApi.get(),
      enabled: platform.plan.embeddingEnabled,
      meta: { showErrorDialog: true, loadSubsetOptions: {} },
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
    const { data, isLoading } = embedSubdomainQueries.useEmbedSubdomain();
    return { subdomain: data ?? undefined, isLoading };
  },
};

export const embedSubdomainMutations = {
  useUpsert: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: GenerateEmbedSubdomainRequest) =>
        embedSubdomainApi.upsert(request),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: embedSubdomainKeys.current,
        });
      },
    });
  },
  useUpdateAllowedDomains: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (request: UpdateEmbedSubdomainAllowedDomainsRequest) =>
        embedSubdomainApi.updateAllowedDomains(request),
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: embedSubdomainKeys.current,
        });
      },
    });
  },
};
