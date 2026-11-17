import { AIProviderName } from '@activepieces/core-utils';
import { AIProviderModelType } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

const { providerRequestUtils } = await import(
  '@/app/routes/platform/setup/ai/providers-tab/provider-request'
);

describe('providerRequestUtils.buildCreateRequest for LiteLLM', () => {
  it('sends the typed-in model ids as text models, once each', () => {
    const request = providerRequestUtils.buildCreateRequest({
      provider: AIProviderName.LITELLM,
      displayName: 'LiteLLM',
      credentials: {
        baseUrl: 'https://litellm.example.com',
        apiKey: 'sk-test',
        apiKeyHeader: 'Authorization',
        typedModels: ' prod-smart, openai/gpt-4o ,, prod-smart',
      },
      headers: {},
    });

    expect('models' in request.config && request.config.models).toEqual([
      {
        modelId: 'prod-smart',
        modelName: 'prod-smart',
        modelType: AIProviderModelType.TEXT,
      },
      {
        modelId: 'openai/gpt-4o',
        modelName: 'openai/gpt-4o',
        modelType: AIProviderModelType.TEXT,
      },
    ]);
    expect(request.config).not.toHaveProperty('typedModels');
  });

  it('keeps the saved models when credentials are replaced', () => {
    const saved = {
      modelId: 'ap-fast',
      modelName: 'ap-fast',
      modelType: AIProviderModelType.TEXT,
      discovered: true,
    };
    const request = providerRequestUtils.buildCreateRequest({
      provider: AIProviderName.LITELLM,
      displayName: 'LiteLLM',
      credentials: {
        baseUrl: 'https://litellm.example.com',
        apiKey: '',
        apiKeyHeader: 'Authorization',
        typedModels: 'ap-fast',
      },
      headers: {},
      existingConfig: {
        baseUrl: 'https://litellm.example.com',
        apiKeyHeader: 'Authorization',
        models: [saved],
      },
    });

    expect('models' in request.config && request.config.models).toEqual([
      saved,
    ]);
  });
});
