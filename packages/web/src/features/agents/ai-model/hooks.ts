import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  ACTIVEPIECES_CHAT_TIERS,
  AIProviderModel,
  ALLOWED_CHAT_MODELS_BY_PROVIDER,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';

type AIModelType = 'text' | 'image';

function getAllowedModelsForProvider(
  provider: AIProviderName,
  allModels: AIProviderModel[],
  modelType: AIModelType,
): AIProviderModel[] {
  const allowedIds =
    provider === AIProviderName.ACTIVEPIECES
      ? ACTIVEPIECES_CHAT_TIERS.map((tier) => tier.modelId)
      : ALLOWED_CHAT_MODELS_BY_PROVIDER[provider];

  return allModels
    .filter((model) => model.type === modelType)
    .filter((model) => {
      if (isNil(allowedIds)) {
        return true;
      }

      return allowedIds.includes(model.id);
    })
    .sort((a, b) => {
      if (isNil(allowedIds)) {
        return a.name.localeCompare(b.name);
      }
      const aIndex = allowedIds.indexOf(a.id);
      const bIndex = allowedIds.indexOf(b.id);
      return aIndex - bIndex;
    })
    .map((model) =>
      provider === AIProviderName.ACTIVEPIECES
        ? { ...model, name: managedTierLabel(model.id) ?? model.name }
        : model,
    );
}

function managedTierLabel(modelId: string): string | undefined {
  return ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.modelId === modelId)
    ?.label;
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
