import { Provider } from '@radix-ui/react-tooltip';
import { useQuery } from '@tanstack/react-query';

import { aiProviderApi } from '@/features/platform-admin/lib/ai-provider-api';
import { AIProviderModel, AIProviderName, isNil } from '@activepieces/shared';

type Provider =
  | 'activepieces'
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'openrouter'
  | 'cloudflare-gateway'
  | 'custom'
  | 'azure';

type AIModelType = 'text' | 'image';

const OPENAI_MODELS = ['gpt-5.2', 'gpt-5.1', 'gpt-5-mini'] as const;

const ANTHROPIC_MODELS = [
  'claude-sonnet-4.5',
  'claude-opus-4-5-20251101',
  'claude-opus-4.5',
  'claude-sonnet-4-5-20250929',
  'claude-haiku-4.5',
  'claude-haiku-4-5-20251001',
] as const;

const GOOGLE_MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
] as const;

const ALLOWED_MODELS_BY_PROVIDER: Partial<Record<Provider, readonly string[]>> =
  {
    openai: OPENAI_MODELS,
    anthropic: ANTHROPIC_MODELS,
    google: GOOGLE_MODELS,
    activepieces: [
      ...OPENAI_MODELS.map((model) => `${AIProviderName.OPENAI}/${model}`),
      ...ANTHROPIC_MODELS.map(
        (model) => `${AIProviderName.ANTHROPIC}/${model}`,
      ),
      ...GOOGLE_MODELS.map((model) => `${AIProviderName.GOOGLE}/${model}`),
    ],
  };

function getAllowedModelsForProvider(
  provider: Provider,
  allModels: AIProviderModel[],
  modelType: AIModelType,
): AIProviderModel[] {
  const allowedIds = ALLOWED_MODELS_BY_PROVIDER[provider];

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

  useGetModelsForProvider: (provider?: Provider) => {
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
