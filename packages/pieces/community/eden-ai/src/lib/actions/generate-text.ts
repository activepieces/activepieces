import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall, EDENAI_V3_BASE_URL } from '../common/client';
import { createStaticDropdown, modelDropdownOptions, providerDropdownOptions } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

const REASONING_EFFORT_OPTIONS = [
  { label: 'Low - Quick responses', value: 'low' },
  { label: 'Medium - Balanced approach', value: 'medium' },
  { label: 'High - In-depth reasoning', value: 'high' }
];

// v3 /chat/completions returns a standard OpenAI-shaped response (not provider-keyed like v2 /llm/chat).
function normalizeChatResponse(response: any) {
  const firstChoice = response?.choices?.[0];
  const message = firstChoice?.message;

  return {
    content: message?.content || '',
    role: message?.role || 'assistant',
    finish_reason: firstChoice?.finish_reason || '',
    usage: response?.usage || null,
    model: response?.model || '',
    raw: response
  };
}

export const generateTextAction = createAction({
  auth: edenAiAuth,
  name: 'generate_text',
  displayName: 'Generate Text',
  description:
    'Generate text completions across 500+ models from every major provider through Eden AI\'s single OpenAI-compatible endpoint. Optionally restrict to EU-hosted models for GDPR data residency.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate a chat/LLM completion from a prompt through Eden AI, routing to any of 500+ models across providers (OpenAI, Anthropic, Google, Mistral, and others) behind one API key, with optional system prompt, temperature, and fallback models. For GDPR-sensitive data, enable "EU Data Residency" to restrict the model list to Eden AI\'s EU-hosted models (processing stays within the EU). Choose it for one-shot text generation when you want provider flexibility behind a single call rather than calling a specific LLM piece directly. Requires a model and prompt; optionally pass an image URL for vision-capable models. Generative and non-deterministic, but stateless — repeating the call creates no extra side effect.',
    idempotent: true,
  },
  props: {
    eu_residency: Property.Checkbox({
      displayName: 'EU Data Residency (GDPR)',
      description:
        'Restrict the Provider and Model lists to Eden AI\'s EU-hosted models, so inference is processed within the European Union. EU-hosted models are flagged with 🇪🇺.',
      required: false,
      defaultValue: false,
    }),
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'Optionally filter the Model list to a single provider. Leave empty to browse all providers.',
      required: false,
      refreshers: ['eu_residency'],
      options: async ({ auth, eu_residency }) => {
        const opts = await providerDropdownOptions(auth);
        // eu_residency is applied at the model level; providers with no EU model still list here,
        // but the Model dropdown will show "no EU-hosted models" for those.
        void eu_residency;
        return opts;
      },
    }),
    model: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Model',
      description:
        'The model to use, as the exact Eden AI `provider/model` id. When "EU Data Residency" is on, only EU-hosted models (🇪🇺) are listed.',
      required: true,
      refreshers: ['provider', 'eu_residency'],
      options: async ({ auth, provider, eu_residency }) =>
        modelDropdownOptions(auth, provider as string | undefined, eu_residency as boolean | undefined),
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The main prompt or question you want the AI to respond to.',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description:
        'System message to set the behavior and context for the AI assistant (e.g., "You are a helpful coding assistant").',
      required: false
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'Controls randomness (0.0-2.0). Higher values make output more creative.',
      required: false,
      defaultValue: 0.7
    }),
    max_completion_tokens: Property.Number({
      displayName: 'Max Completion Tokens',
      description: 'Maximum number of tokens to generate in the response.',
      required: false,
      defaultValue: 1000
    }),
    reasoning_effort: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Reasoning Effort',
      description: 'Level of reasoning depth for the response (only used by reasoning-capable models).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(REASONING_EFFORT_OPTIONS)
    }),
    fallback_models: Property.MultiSelectDropdown({
      auth: edenAiAuth,
      displayName: 'Fallback Models',
      description: 'Alternative models (exact `provider/model` ids) to try if the primary model fails.',
      required: false,
      refreshers: ['eu_residency'],
      options: async ({ auth, eu_residency }) =>
        modelDropdownOptions(auth, undefined, eu_residency as boolean | undefined),
    }),
    include_image: Property.Checkbox({
      displayName: 'Include Image',
      description: 'Include an image in your prompt (for vision-capable models).',
      required: false,
      defaultValue: false,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'URL of the image to include in the prompt (only used if "Include Image" is enabled).',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      model: z.string().check(z.minLength(1, 'Model is required')),
      prompt: z.string().check(z.minLength(1, 'Prompt is required')),
      temperature: z.nullish(z.number().check(z.minimum(0), z.maximum(2))),
      max_completion_tokens: z.nullish(z.number().check(z.minimum(1))),
      image_url: z.nullish(z.string().check(z.url()))
    });

    const {
      model,
      prompt,
      system_prompt,
      temperature,
      max_completion_tokens,
      reasoning_effort,
      fallback_models,
      include_image,
      image_url
    } = propsValue;

    const messages: any[] = [];

    if (system_prompt) {
      messages.push({
        role: 'system',
        content: [{ type: 'text', text: system_prompt }]
      });
    }

    const userContent: any[] = [{ type: 'text', text: prompt }];

    if (include_image && image_url) {
      userContent.push({
        type: 'image_url',
        image_url: { url: image_url }
      });
    }

    messages.push({
      role: 'user',
      content: userContent
    });

    // v3 /chat/completions takes the exact "provider/model" id (EU-hosted models are chosen via the
    // Model dropdown when EU Data Residency is enabled — there is no suffix to append).
    const body: Record<string, any> = {
      model,
      messages
    };

    if (temperature !== undefined) body['temperature'] = temperature;
    if (max_completion_tokens !== undefined) body['max_tokens'] = max_completion_tokens;
    if (reasoning_effort) body['reasoning_effort'] = reasoning_effort;
    if (fallback_models && fallback_models.length > 0) {
      // Eden AI extension to the OpenAI-compatible endpoint: models tried on failure.
      body['fallback_providers'] = fallback_models;
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.POST,
        baseUrl: EDENAI_V3_BASE_URL,
        resourceUri: '/chat/completions',
        body
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeChatResponse(response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error(
          'Invalid API key. Please check your Eden AI credentials.'
        );
      }
      if (err.message && typeof err.message === 'string') {
        throw new Error(`Failed to generate text: ${err.message}`);
      }
      throw new Error(`Failed to generate text: ${JSON.stringify(err)}`);
    }
  }
});
