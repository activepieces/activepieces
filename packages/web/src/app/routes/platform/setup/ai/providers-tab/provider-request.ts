import { AIProviderName } from '@activepieces/core-utils';
import {
  AIProviderConfig,
  AIProviderWithoutSensitiveData,
  CreateAIProviderRequest,
  ProviderModelConfig,
} from '@activepieces/shared';

function buildCreateRequest({
  provider,
  displayName,
  credentials,
  headers,
  existingConfig,
}: BuildRequestParams): CreateAIProviderRequest {
  const value = (key: string) => (credentials[key] ?? '').trim();
  const optional = (key: string) => {
    const trimmed = value(key);
    return trimmed.length > 0 ? trimmed : undefined;
  };
  const models = existingModelsOf({ existingConfig });

  switch (provider) {
    case AIProviderName.AZURE:
      return {
        provider,
        displayName,
        config: {
          resourceName: value('resourceName'),
          apiVersion: optional('apiVersion'),
        },
        auth: { apiKey: value('apiKey') },
      };
    case AIProviderName.BEDROCK:
      return {
        provider,
        displayName,
        config: { region: value('region') },
        auth: {
          accessKeyId: value('accessKeyId'),
          secretAccessKey: value('secretAccessKey'),
        },
      };
    case AIProviderName.CLOUDFLARE_GATEWAY:
      return {
        provider,
        displayName,
        config: {
          accountId: value('accountId'),
          gatewayId: value('gatewayId'),
          vertexRegion: optional('vertexRegion'),
          vertexProject: optional('vertexProject'),
          models,
        },
        auth: { apiKey: value('apiKey') },
      };
    case AIProviderName.CUSTOM:
      return {
        provider,
        displayName,
        config: {
          baseUrl: value('baseUrl'),
          apiKeyHeader: value('apiKeyHeader'),
          apiStyle: value('apiStyle') === 'responses' ? 'responses' : undefined,
          defaultHeaders: Object.keys(headers).length > 0 ? headers : undefined,
          models,
        },
        auth: { apiKey: value('apiKey') },
      };
    case AIProviderName.OPENAI:
    case AIProviderName.ANTHROPIC:
    case AIProviderName.GOOGLE:
    case AIProviderName.OPENROUTER:
    case AIProviderName.MISTRAL:
    case AIProviderName.XAI:
    case AIProviderName.DEEPSEEK:
    case AIProviderName.ZAI:
    case AIProviderName.QWEN:
    case AIProviderName.MINIMAX:
    case AIProviderName.MOONSHOT:
      return {
        provider,
        displayName,
        config: {},
        auth: { apiKey: value('apiKey') },
      };
    case AIProviderName.ACTIVEPIECES:
      throw new Error(`Provider ${provider} cannot be connected manually`);
  }
}

function credentialPrefillOf({
  row,
}: {
  row: AIProviderWithoutSensitiveData;
}): Record<string, string> {
  const config: Record<string, unknown> = row.config;
  return Object.fromEntries(
    Object.entries(config)
      .filter(([, entry]) => typeof entry === 'string')
      .map(([key, entry]) => [key, String(entry)]),
  );
}

function headersPrefillOf({
  row,
}: {
  row: AIProviderWithoutSensitiveData;
}): Record<string, string> {
  if ('defaultHeaders' in row.config && row.config.defaultHeaders) {
    return row.config.defaultHeaders;
  }
  return {};
}

function existingModelsOf({
  existingConfig,
}: {
  existingConfig?: AIProviderConfig;
}): ProviderModelConfig[] {
  if (existingConfig && 'models' in existingConfig) {
    return existingConfig.models;
  }
  return [];
}

export const providerRequestUtils = {
  buildCreateRequest,
  credentialPrefillOf,
  headersPrefillOf,
};

type BuildRequestParams = {
  provider: AIProviderName;
  displayName: string;
  credentials: Record<string, string>;
  headers: Record<string, string>;
  existingConfig?: AIProviderConfig;
};
