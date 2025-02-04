import { Property } from '@activepieces/pieces-framework';
import {
  AiProviderWithoutSensitiveData,
  isNil,
  SeekPage,
} from '@activepieces/shared';
import { Static, Type } from '@sinclair/typebox';
import { httpClient, HttpMethod } from '../../http';
import { anthropic } from './anthropic';
import { openai, openaiModels } from './openai';
import { replicate, replicateModels } from './replicate';
import { authHeader, hasMapper, model } from './utils';

export const AI_PROVIDERS_MAKRDOWN = {
  openai: `Follow these instructions to get your OpenAI API Key:

1. Visit the following website: https://platform.openai.com/account/api-keys.
2. Once on the website, locate and click on the option to obtain your OpenAI API Key.

It is strongly recommended that you add your credit card information to your OpenAI account and upgrade to the paid plan **before** generating the API Key. This will help you prevent 429 errors.
`,
  anthropic: `Follow these instructions to get your Claude API Key:

1. Visit the following website: https://console.anthropic.com/settings/keys.
2. Once on the website, locate and click on the option to obtain your Claude API Key.
`,
  replicate: `Follow these instructions to get your Replicate API Key:

1. Visit the following website: https://replicate.com/account/api-tokens.
2. Once on the website, locate and click on the option to obtain your Replicate API Key.
`,
};

export const AI_PROVIDERS = [
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/openai.png',
    defaultBaseUrl: 'https://api.openai.com',
    label: 'OpenAI' as const,
    value: 'openai' as const,
    models: openaiModels,
    auth: authHeader({ bearer: true }),
    factory: openai,
    instructionsMarkdown: AI_PROVIDERS_MAKRDOWN.openai,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/claude.png',
    defaultBaseUrl: 'https://api.anthropic.com',
    label: 'Anthropic' as const,
    value: 'anthropic' as const,
    models: [
      model({
        label: 'claude-3-5-sonnet',
        value: 'claude-3-5-sonnet-latest',
        supported: ['text', 'function'],
      }),
      model({
        label: 'claude-3-opus',
        value: 'claude-3-opus-20240229',
        supported: ['text', 'function'],
      }),
      model({
        label: 'claude-3-sonnet',
        value: 'claude-3-sonnet-20240229',
        supported: ['text', 'function'],
      }),
      model({
        label: 'claude-3-5-haiku',
        value: 'claude-3-5-haiku-latest',
        supported: ['text', 'function'],
      }),
      model({
        label: 'claude-3-haiku',
        value: 'claude-3-haiku-20240307',
        supported: ['text', 'function'],
      }),
    ],
    auth: authHeader({ name: 'x-api-key', bearer: false }),
    factory: anthropic,
    instructionsMarkdown: AI_PROVIDERS_MAKRDOWN.anthropic,
  },
  {
    logoUrl: 'https://cdn.activepieces.com/pieces/replicate.png',
    defaultBaseUrl: 'https://api.replicate.com',
    label: 'Replicate' as const,
    value: 'replicate' as const,
    models: replicateModels,
    auth: authHeader({ bearer: true }),
    factory: replicate,
    instructionsMarkdown: AI_PROVIDERS_MAKRDOWN.replicate,
  },
];

export const aiProps = (
  supported: 'text' | 'image' | 'function' | 'moderation'
) => ({
  provider: Property.Dropdown<AiProvider, true>({
    displayName: 'Provider',
    required: true,
    defaultValue: 'openai',
    refreshers: [],
    options: async (_, ctx) => {
      const providers = await httpClient.sendRequest<
        SeekPage<AiProviderWithoutSensitiveData>
      >({
        method: HttpMethod.GET,
        url: `${ctx.server.apiUrl}v1/ai-providers`,
        headers: {
          Authorization: `Bearer ${ctx.server.token}`,
        },
      });
      if (providers.body.data.length === 0) {
        return {
          disabled: true,
          options: [],
          placeholder: 'No AI providers configured by the admin.',
        };
      }

      const providersWithMetadata = providers.body.data.flatMap((p) => {
        const providerMetadata = AI_PROVIDERS.find(
          (meta) =>
            meta.value === p.provider &&
            meta.models.some((m) => m.supported.includes(supported))
        );
        if (isNil(providerMetadata)) {
          return [];
        }
        return [
          {
            value: providerMetadata.value,

            label: providerMetadata.label,
            models: providerMetadata.models,
          },
        ];
      });

      return {
        placeholder: 'Select AI Provider',
        disabled: false,
        options: providersWithMetadata,
      };
    },
  }),
  model: Property.Dropdown<string, true>({
    displayName: 'Model',
    required: true,
    defaultValue: 'gpt-4o',
    refreshers: ['provider'],
    options: async ({ provider }) => {
      if (isNil(provider)) {
        return {
          disabled: true,

          options: [],
          placeholder: 'Select AI Provider',
        };
      }
      const models = AI_PROVIDERS.find(
        (p) => p.value === provider
      )?.models.filter((m) => m.supported.includes(supported));
      return {
        disabled: isNil(models),
        options: models ?? [],
      };
    },
  }),
  advancedOptions: Property.DynamicProperties<false>({
    displayName: 'Advanced Options',
    required: false,
    refreshers: ['provider', 'model'],
    props: async ({ model, provider }) => {
      const modelMetadata = AI_PROVIDERS.find(
        (p) => p.value === (provider as unknown as string)
      )?.models.find((m) => m.value === (model as unknown as string));
      if (isNil(modelMetadata) || !hasMapper(modelMetadata)) {
        return {};
      }
      return modelMetadata.mapper.advancedOptions ?? {};
    },
  }),
});

export type AiProviderMetadata = (typeof AI_PROVIDERS)[number];

export const AiProvider = Type.Union(
  AI_PROVIDERS.map((p) => Type.Literal(p.value))
);

export type AiProvider = Static<typeof AiProvider>;

export * from './utils';
