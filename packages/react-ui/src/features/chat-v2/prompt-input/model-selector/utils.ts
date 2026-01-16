import { AIProviderModel, AIProviderName, isNil } from '@activepieces/shared';

type AIModelType = 'text' | 'image';

const OPENAI_MODELS = ['gpt-5.2', 'gpt-5.1', 'gpt-5-mini'] as const;

const ANTHROPIC_MODELS = [
  'claude-sonnet-4-5-20250929',
  'claude-opus-4-5-20251101',
  'claude-haiku-4-5-20251001',
] as const;

const GOOGLE_MODELS = [
  'gemini-3-pro-preview',
  'gemini-3-flash-preview',
  'gemini-2.5-flash-preview-09-2025',
  'gemini-2.5-flash-lite-preview-09-2025',
] as const;

const ALLOWED_MODELS_BY_PROVIDER: Partial<
  Record<AIProviderName, readonly string[]>
> = {
  openai: OPENAI_MODELS,
  anthropic: ANTHROPIC_MODELS,
  google: GOOGLE_MODELS,
  activepieces: [
    ...OPENAI_MODELS.map((model) => `${AIProviderName.OPENAI}/${model}`),
    ...ANTHROPIC_MODELS.map((model) => `${AIProviderName.ANTHROPIC}/${model}`),
    ...GOOGLE_MODELS.map((model) => `${AIProviderName.GOOGLE}/${model}`),
  ],
};

export function getAllowedModelsForProvider(
  provider: AIProviderName,
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
