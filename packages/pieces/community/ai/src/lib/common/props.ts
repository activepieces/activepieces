import { ACTIVEPIECES_CHAT_TIERS } from '@activepieces/core-utils';
import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { AIProviderModel, AIProviderName, AIProviderWithoutSensitiveData } from '@activepieces/pieces-framework';

type AIModelType = 'text' | 'image';

function managedModelLabel(modelId: string): string | undefined {
  return ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.modelId === modelId)?.label;
}

type AIPropsParams<T extends AIModelType> = {
  modelType: T;
  allowedProviders?: AIProviderName[];
};

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
      const provider = propsValue['provider'] as string

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

      return {
        placeholder: 'Select AI Model',
        disabled: false,
        options: allModels
          .filter(model => model.type === modelType)
          .filter(model => provider !== AIProviderName.ACTIVEPIECES || managedModelLabel(model.id) !== undefined)
          .map(model => ({
            label: provider === AIProviderName.ACTIVEPIECES ? (managedModelLabel(model.id) ?? model.name) : model.name,
            value: model.id,
          })),
      };
    },
  }),
});