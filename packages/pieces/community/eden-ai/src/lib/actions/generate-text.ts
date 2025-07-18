import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown, normalizeProviderItems } from '../common/providers';

const CODE_GENERATION_STATIC_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'XAI', value: 'xai' },
];

function normalizeCodeGeneration(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    generated_text: item.generated_text || item.text || '',
    model: item.model || '',
    language: item.language || '',
    provider: item.provider || provider,
    raw: item,
  }));
}

export const generateTextAction = createAction({
  name: 'generate_text',
  displayName: 'Generate Text',
  description: 'Produce text completions from prompts using Eden AI code generation endpoint.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(CODE_GENERATION_STATIC_PROVIDERS),
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The prompt to generate text from.',
      required: true,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0-1, optional)',
      required: false,
      defaultValue: 0.7,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate (optional)',
      required: false,
      defaultValue: 256,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Programming language for code generation (optional, e.g., python, javascript, etc).',
      required: false,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, prompt, temperature, max_tokens, language, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      throw new Error('Prompt is required and must be a non-empty string.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      prompt,
      fallback_providers: fallback_providers || [],
    };
    if (temperature !== undefined) body['temperature'] = temperature;
    if (max_tokens !== undefined) body['max_tokens'] = max_tokens;
    if (language) body['language'] = language;
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/text/code_generation',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeCodeGeneration(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to generate text: ${err.message || err}`);
    }
  },
}); 