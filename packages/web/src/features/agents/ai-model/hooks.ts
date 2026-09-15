import { AIProviderName, isNil } from '@activepieces/core-utils';
import {
  AIProviderModel,
  ALLOWED_CHAT_MODELS_BY_PROVIDER,
} from '@activepieces/shared';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/api/ai-provider-api';
import { authenticationSession } from '@/lib/authentication-session';

import { ChatTier, useChatTiers } from './use-chat-tiers';

type AIModelType = 'text' | 'image';

function getAllowedModelsForProvider(
  provider: AIProviderName,
  allModels: AIProviderModel[],
  modelType: AIModelType,
  tiers: ChatTier[],
): AIProviderModel[] {
  const allowedIds =
    provider === AIProviderName.ACTIVEPIECES
      ? tiers.map((tier) => tier.modelId)
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
        ? {
            ...model,
            name: managedTierLabel({ modelId: model.id, tiers }) ?? model.name,
          }
        : model,
    );
}

function managedTierLabel({
  modelId,
  tiers,
}: {
  modelId: string;
  tiers: ChatTier[];
}): string | undefined {
  return tiers.find((tier) => tier.modelId === modelId)?.label;
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
    const { tiers } = useChatTiers();
    return useQuery({
      queryKey: ['ai-models', provider, configId, projectId, tiers],
      enabled: !isNil(provider) && !isNil(projectId),
      queryFn: async () => {
        if (isNil(provider) || isNil(projectId)) return [];

        const allModels = await aiProviderApi.listModelsForProvider(
          provider,
          projectId,
          configId,
        );

        return getAllowedModelsForProvider(provider, allModels, 'text', tiers);
      },
    });
  },
};
