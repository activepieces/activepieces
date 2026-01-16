import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { AIProviderName, isNil } from '@activepieces/shared';

import { getAllowedModelsForProvider } from './utils';
export const aiModelHooks = {
  useListProviders: () => {
    return useQuery({
      queryKey: ['ai-providers'],
      queryFn: () => aiProviderApi.list(),
    });
  },

  useGetModelsForProvider: (provider?: AIProviderName) => {
    return useQuery({
      queryKey: ['ai-models', provider],
      enabled: !!provider,
      queryFn: async () => {
        if (isNil(provider)) return [];

        const allModels = await aiProviderApi.listModelsForProvider(provider);

        return getAllowedModelsForProvider(provider, allModels, 'text');
      },
    });
  },
};
