import { ACTIVEPIECES_CHAT_TIERS, PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { AIProviderModel, AIProviderName, ProjectAIProvider } from '@activepieces/pieces-framework';

type AIModelType = 'text' | 'image';

function managedModelLabel(modelId: string): string | undefined {
  return ACTIVEPIECES_CHAT_TIERS.find((tier) => tier.modelId === modelId)?.label;
}

async function listProviders(ctx: {
  server: { apiUrl: string; token: string };
}): Promise<ProjectAIProvider[]> {
  const { body } = await httpClient.sendRequest<ProjectAIProvider[]>({
    method: HttpMethod.GET,
    url: `${ctx.server.apiUrl}v1/ai-providers`,
    headers: {
      Authorization: `Bearer ${ctx.server.token}`,
    },
  });
  return body;
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
      const supportedProviders = await listProviders(ctx);

      return {
        placeholder: 'Select AI Provider',
        disabled: false,
        options: supportedProviders
          .filter(provider =>
            allowedProviders
              ? allowedProviders.includes(provider.provider)
              : true
          )
          .map(provider => ({
            label: provider.name,
            value: provider.provider,
          })),
      };
    },
  }),

  configuration: Property.Dropdown<string, false>({
    auth: PieceAuth.None(),
    displayName: 'Configuration',
    description:
      'Which key of this provider to use. Leave empty to use the one your admin scoped to this project.',
    required: false,
    refreshers: ['provider'],
    options: async (propsValue, ctx) => {
      const provider = propsValue['provider'] as string;

      if (isNil(provider)) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select AI Provider',
        };
      }

      const supportedProviders = await listProviders(ctx);
      const keys =
        supportedProviders.find(entry => entry.provider === provider)?.keys ??
        [];

      return {
        placeholder: 'Automatic',
        disabled: false,
        options: keys.map(key => ({
          label: key.name,
          value: key.id,
        })),
      };
    },
  }),

  model: Property.Dropdown({
    auth: PieceAuth.None(),
    displayName: 'Model',
    required: true,
    refreshers: ['provider', 'configuration'],
    options: async (propsValue, ctx) => {
      const provider = propsValue['provider'] as string
      const configuration = propsValue['configuration'] as string | undefined

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
          ...(isNil(configuration) ? {} : { queryParams: { configId: configuration } }),
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