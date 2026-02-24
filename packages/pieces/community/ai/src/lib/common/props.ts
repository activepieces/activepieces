import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  isNil,
  AIProviderModel,
  AIProviderName,
  AIProviderWithoutSensitiveData,
} from '@activepieces/shared';

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

type AIPropsParams<T extends AIModelType> = {
  modelType: T;
  allowedProviders?: AIProviderName[];
};

const RESTRICTED_PROVIDER_MODELS: Partial<Record<Provider, string[]>> = {
  openai: [
    'gpt-5.2',
    'gpt-5.1',
    'gpt-5-mini',
  ],
  anthropic: [
    'claude-sonnet-4-5-20250929',
    'claude-opus-4-5-20251101',
    'claude-haiku-4-5-20251001',
  ],
  google: [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-flash-preview-09-2025',
    'gemini-2.5-flash-lite-preview-09-2025',
  ],
};

function getAllowedModelsForProvider(
  provider: Provider,
  allModels: AIProviderModel[],
  modelType: AIModelType
): AIProviderModel[] {
  const restrictedModels = RESTRICTED_PROVIDER_MODELS[provider];

  return allModels
    .filter(model => model.type === modelType)
    .filter(model => {
      if (isNil(restrictedModels)) {
        return true;
      }

      return restrictedModels.includes(model.id);
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export const aiProps = <T extends AIModelType>({
  modelType,
  allowedProviders,
}: AIPropsParams<T>) => ({
  provider: Property.Dropdown<string, true>({
    auth: PieceAuth.None(),
    displayName: 'Provider',
    required: true,
    refreshers: [],
    options: async (_, ctx) => {
      const { body: supportedProviders } =
        await httpClient.sendRequest<AIProviderWithoutSensitiveData[]>({
          method: HttpMethod.GET,
          url: `${ctx.server.apiUrl}v1/ai-providers`,
          headers: {
            Authorization: `Bearer ${ctx.server.token}`,
          },
        });

      return {
        placeholder: 'Select AI Provider',
        disabled: false,
        options: supportedProviders
          .map(provider => ({
            label: provider.name,
            value: provider.provider,
          }))
          .filter(option =>
            allowedProviders
              ? allowedProviders.includes(option.value as AIProviderName)
              : true
          ),
      };
    },
  }),

  model: Property.Dropdown({
    auth: PieceAuth.None(),
    displayName: 'Model',
    required: true,
    refreshers: ['provider'],
    options: async (propsValue, ctx) => {
      const provider = propsValue['provider'] as Provider | undefined;

      if (isNil(provider)) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select AI Provider',
        };
      }

      const { body: allModels } =
        await httpClient.sendRequest<AIProviderModel[]>({
          method: HttpMethod.GET,
          url: `${ctx.server.apiUrl}v1/ai-providers/${provider}/models`,
          headers: {
            Authorization: `Bearer ${ctx.server.token}`,
          },
        });

      const models = getAllowedModelsForProvider(
        provider,
        allModels,
        modelType
      );

      return {
        placeholder: 'Select AI Model',
        disabled: false,
        options: models.map(model => ({
          label: model.name,
          value: model.id,
        })),
      };
    },
  }),
});