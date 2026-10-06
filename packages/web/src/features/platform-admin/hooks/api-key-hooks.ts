import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { t } from 'i18next';

import { platformHooks } from '@/hooks/platform-hooks';
import { mutationFeedback } from '@/lib/mutation-feedback';

import { apiKeyApi } from '../api/api-key-api';

export const apiKeyKeys = {
  all: ['api-keys'] as const,
};

export const apiKeyQueries = {
  useApiKeys: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: apiKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => apiKeyApi.list(),
      enabled: platform.plan.apiKeysEnabled,
    });
  },
};

export const apiKeyMutations = {
  useCreateApiKey: ({ onSuccess }: { onSuccess: () => void }) => {
    return useMutation({
      mutationFn: (request: { displayName: string }) =>
        apiKeyApi.create(request),
      onSuccess,
    });
  },
  useDeleteApiKey: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (keyId: string) => {
        await apiKeyApi.delete(keyId);
        await queryClient.invalidateQueries({ queryKey: apiKeyKeys.all });
      },
      onError: (error) => {
        mutationFeedback.error({ error, title: t("Couldn't revoke the key") });
      },
    });
  },
};
