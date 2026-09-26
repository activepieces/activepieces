import { ACTIVEPIECES_CHAT_TIERS, ACTIVEPIECES_IMAGE_TIERS, PieceAuth, Property, tryCatch } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import { AIProviderModel, AIProviderName, ProjectAIProvider } from '@activepieces/pieces-framework';

type AIModelType = 'text' | 'image';

function managedModelLabel({ modelId, modelType }: { modelId: string; modelType: AIModelType }): string | undefined {
  const tiers = modelType === 'image' ? ACTIVEPIECES_IMAGE_TIERS : ACTIVEPIECES_CHAT_TIERS;
  return tiers.find((tier) => tier.modelId === modelId)?.label;
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

async function listTiers(ctx: {
  server: { apiUrl: string; token: string };
}): Promise<ListedTier[] | null> {
  const { data } = await tryCatch(async () => {
    const { body } = await httpClient.sendRequest<ListedTiers>({
      method: HttpMethod.GET,
      url: `${ctx.server.apiUrl}v1/ai-providers/tiers`,
      headers: {
        Authorization: `Bearer ${ctx.server.token}`,
      },
    });
    return body.tiers;
  });
  return data;
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

      if (provider === AIProviderName.ACTIVEPIECES && modelType === 'text') {
        const tiers = await listTiers(ctx);
        if (!isNil(tiers) && tiers.length > 0) {
          return {
            placeholder: 'Select AI Model',
            disabled: false,
            options: tiers.map(tier => ({ label: tier.label, value: tier.id })),
          };
        }
      }

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
          .filter(model => provider !== AIProviderName.ACTIVEPIECES || managedModelLabel({ modelId: model.id, modelType }) !== undefined)
          .map(model => ({
            label: provider === AIProviderName.ACTIVEPIECES ? (managedModelLabel({ modelId: model.id, modelType }) ?? model.name) : model.name,
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

type ListedTier = {
  id: string;
  label: string;
  modelId: string;
};

type ListedTiers = {
  tiers: ListedTier[];
  defaultTierId: string;
};
