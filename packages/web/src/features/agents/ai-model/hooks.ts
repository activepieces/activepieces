import {
  AIProviderModel,
  AIProviderName,
  ALLOWED_CHAT_MODELS_BY_PROVIDER,
  isNil,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

type AIModelType = 'text' | 'image';

function getAllowedModelsForProvider(
  provider: AIProviderName,
  allModels: AIProviderModel[],
  modelType: AIModelType,
): AIProviderModel[] {
  const allowedIds = ALLOWED_CHAT_MODELS_BY_PROVIDER[provider];

  return allModels
    .filter((model) => model.type === modelType)
    .filter((model) => {
      if (isNil(allowedIds)) {
        return true;
      }

      return allowedIds.includes(model.id);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

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
