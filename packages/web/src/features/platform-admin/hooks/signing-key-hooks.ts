import { useQuery } from '@tanstack/react-query';

import { platformHooks } from '@/hooks/platform-hooks';

import { signingKeyApi } from '../api/signing-key-api';

export const signingKeyKeys = {
  all: ['signing-keys'] as const,
};

export const signingKeyQueries = {
  useSigningKeys: () => {
    const { platform } = platformHooks.useCurrentPlatform();
    return useQuery({
      queryKey: signingKeyKeys.all,
      gcTime: 0,
      staleTime: 0,
      queryFn: () => signingKeyApi.list(),
      enabled: platform.plan.embeddingEnabled,
    });
  },
};
