import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AIProviderModel,
  AIProviderModelType,
  ALLOWED_CHAT_MODELS_BY_PROVIDER,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

import {
  aiProviderApi,
  ModelTier,
} from '@/features/platform-admin/api/ai-provider-api';
import { aiProviderQueries } from '@/features/platform-admin/hooks/ai-provider-hooks';
import { authenticationSession } from '@/lib/authentication-session';

type AIModelType = 'text' | 'image';

function getAllowedModelsForProvider({
  provider,
  allModels,
  modelType,
  flowTiers,
}: {
  provider: AIProviderName;
  allModels: AIProviderModel[];
  modelType: AIModelType;
  flowTiers: ModelTier[];
}): AIProviderModel[] {
  if (provider === AIProviderName.ACTIVEPIECES) {
    return flowTiers.map((tier) => ({
      id: tier.id,
      name: tier.label,
      type: AIProviderModelType.TEXT,
    }));
  }
  const allowedIds = ALLOWED_CHAT_MODELS_BY_PROVIDER[provider];

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
    });
}

export const aiModelHooks = {
  useListProviders: () => {
    const projectId = authenticationSession.getProjectId();
    return useQuery({
      queryKey: ['ai-providers', projectId],
      enabled: !isNil(projectId),
      queryFn: () =>
        isNil(projectId) ? [] : aiProviderApi.listForProject(projectId),
    });
  },

  useGetModelsForProvider: (provider?: AIProviderName, configId?: string) => {
    const projectId = authenticationSession.getProjectId();
    const { tiers: flowTiers } = aiProviderQueries.useModelTiers('flow');
    const select = useCallback(
      (allModels: AIProviderModel[]) =>
        isNil(provider)
          ? []
          : getAllowedModelsForProvider({
              provider,
              allModels,
              modelType: 'text',
              flowTiers,
            }),
      [provider, flowTiers],
    );
    return useQuery({
      queryKey: ['ai-models', provider, configId, projectId],
      enabled: !isNil(provider) && !isNil(projectId),
      queryFn: () =>
        isNil(provider) ||
        isNil(projectId) ||
        provider === AIProviderName.ACTIVEPIECES
          ? []
          : aiProviderApi.listModelsForProvider(provider, projectId, configId),
      select,
    });
  },
};
