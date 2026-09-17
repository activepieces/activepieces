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
}): Promise<ListedProvider[]> {
  const { body } = await httpClient.sendRequest<ListedProvider[]>({
    method: HttpMethod.GET,
    url: `${ctx.server.apiUrl}v1/ai-providers`,
    headers: {
      Authorization: `Bearer ${ctx.server.token}`,
    },
  });
  return body;
}

function providerOptionsOf(provider: ListedProvider): {
  label: string;
  value: AIProviderSelection;
}[] {
  const keys = provider.keys ?? [];
  if (keys.length === 0) {
    return [{ label: provider.name, value: { provider: provider.provider } }];
  }
  return keys.map((key) => ({
    label: keys.length > 1 ? `${provider.name}: ${key.name}` : provider.name,
    value: { provider: provider.provider, configId: key.id },
  }));
}

function toProviderName(value: string): AIProviderName | undefined {
  return Object.values(AIProviderName).find((provider) => provider === value);
}

function resolveSelection(value: unknown): AIProviderSelection | undefined {
  if (typeof value === 'string') {
    const provider = toProviderName(value);
    return isNil(provider) ? undefined : { provider };
  }
  if (typeof value !== 'object' || isNil(value) || !('provider' in value)) {
    return undefined;
  }
  const provider =
    typeof value.provider === 'string'
      ? toProviderName(value.provider)
      : undefined;
  if (isNil(provider)) {
    return undefined;
  }
  const configId =
    'configId' in value && typeof value.configId === 'string'
      ? value.configId
      : undefined;
  return { provider, ...(isNil(configId) ? {} : { configId }) };
}

export const aiProps = <T extends AIModelType>({
  modelType,
  allowedProviders,
}: AIPropsParams<T>) => ({
  provider: Property.Dropdown<AIProviderSelection, true>({
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
          .flatMap(provider => providerOptionsOf(provider)),
      };
    },
  }),

  model: Property.Dropdown({
    auth: PieceAuth.None(),
    displayName: 'Model',
    required: true,
    refreshers: ['provider'],
    options: async (propsValue, ctx) => {
      const selection = resolveSelection(propsValue['provider'])

      if (isNil(selection)) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Select AI Provider',
        };
      }

      const { provider, configId } = selection;
      const { body: allModels } =
        await httpClient.sendRequest<AIProviderModel[]>({
          method: HttpMethod.GET,
          url: `${ctx.server.apiUrl}v1/ai-providers/${provider}/models`,
          headers: {
            Authorization: `Bearer ${ctx.server.token}`,
          },
          ...(isNil(configId) ? {} : { queryParams: { configId } }),
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

function resolveSelectionOrThrow(value: unknown): AIProviderSelection {
  const selection = resolveSelection(value);
  if (isNil(selection)) {
    throw new Error('Pick an AI provider for this step');
  }
  return selection;
}

export const aiProviderSelection = {
  resolve: resolveSelection,
  resolveOrThrow: resolveSelectionOrThrow,
};

export type AIProviderSelection = {
  provider: AIProviderName;
  configId?: string;
};

type AIPropsParams<T extends AIModelType> = {
  modelType: T;
  allowedProviders?: AIProviderName[];
};

type ListedProvider = Omit<ProjectAIProvider, 'keys'> & {
  keys?: ProjectAIProvider['keys'];
};
