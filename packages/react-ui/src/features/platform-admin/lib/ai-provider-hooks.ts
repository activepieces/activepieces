import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from './ai-provider-api';

export const aiProviderHooks = {
  useConfig: ({
    providerId,
    enabled = true,
  }: {
    providerId: string;
    enabled?: boolean;
  }) => {
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['ai-provider-config', providerId],
      enabled,
      staleTime: 0,
      retry: false,
      queryFn: () => aiProviderApi.getConfig(providerId),
    });
    return { data, isLoading, refetch };
  },
};
