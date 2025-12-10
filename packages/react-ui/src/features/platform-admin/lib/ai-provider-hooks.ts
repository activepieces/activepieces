import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from './ai-provider-api';

export const aiProviderHooks = {
  useConfig: (provider: string, enabled: boolean = true) => {
    const { data, isLoading, refetch } = useQuery({
      queryKey: ['ai-provider-config', provider],
      enabled,
      staleTime: 0,
      retry: false,
      queryFn: () => aiProviderApi.getConfig(provider),
    });
    return { data, isLoading, refetch };
  },
};
