import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

const CHAT_PROVIDERS = [
  { label: 'OpenAI', value: 'openai' },
  { label: 'Anthropic', value: 'anthropic' },
  { label: 'Google', value: 'google' },
  { label: 'Meta', value: 'meta' },
  { label: 'Mistral', value: 'mistral' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'xAI', value: 'xai' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'DeepSeek', value: 'deepseek' },
  { label: 'Groq', value: 'groq' }
];

const REASONING_EFFORT_OPTIONS = [
  { label: 'Low - Quick responses', value: 'low' },
  { label: 'Medium - Balanced approach', value: 'medium' },
  { label: 'High - In-depth reasoning', value: 'high' }
];

function normalizeChatResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, content: '', usage: null, raw: response };
  }

  const choices = providerResult.choices || [];
  const firstChoice = choices[0];
  const message = firstChoice?.message;

  return {
    provider,
    content: message?.content || '',
    role: message?.role || 'assistant',
    finish_reason: firstChoice?.finish_reason || '',
    usage: providerResult.usage || null,
    model: providerResult.model || '',
    raw: response
  };
}

export const generateTextAction = createAction({
  auth: edenAiAuth,
  name: 'generate_text',
  classification: 'READ',
  displayName: 'Generate Text',
  description: 'Get a reply from the AI model of your choice.',
  audience: 'both',
  aiMetadata: {
    description:
      'Generate a chat/LLM completion from a prompt through Eden AI, routing to a chosen provider (OpenAI, Anthropic, Google, Meta, Mistral, and others) with optional system prompt, model override, temperature, and fallback providers. Choose it for one-shot text generation when you want provider flexibility behind a single call rather than calling a specific LLM piece directly. Requires a provider and prompt; optionally pass an image URL for vision-capable models. Generative and non-deterministic, but stateless — repeating the call creates no extra side effect.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['prompt', 'system_prompt'] },
    { key: 'image', display: 'section', label: 'Image', icon: 'file', props: ['include_image'] },
    { key: 'response', display: 'section', label: 'Response', icon: 'sliders', props: ['temperature', 'max_completion_tokens', 'reasoning_effort'] },
    { key: 'ai_model', display: 'section', label: 'AI Provider', icon: 'code', props: ['provider', 'model'] },
  ],
  props: {
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'The AI service that runs this step.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(CHAT_PROVIDERS),
    }),
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'What you want the AI to answer or do.',
      required: true,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt',
      description: "Sets the assistant's role, tone and rules.",
      placeholder: 'You are a helpful assistant.',
      required: false
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Leave empty to use a default model for the provider.',
      placeholder: 'gpt-4o',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'From 0 to 2. Higher values give more varied replies.',
      required: false,
      defaultValue: 0.7,
      width: 'half',
    }),
    max_completion_tokens: Property.Number({
      displayName: 'Maximum Tokens',
      description: 'Longest reply allowed, in tokens.',
      required: false,
      defaultValue: 1000,
      width: 'half',
    }),
    reasoning_effort: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Reasoning Effort',
      description: 'How long the model thinks first. Only for reasoning models.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(REASONING_EFFORT_OPTIONS)
    }),
    fallback_providers: Property.MultiSelectDropdown({
      auth: edenAiAuth,
      displayName: 'Fallback Providers',
      description: 'Tried in order if the main provider fails.',
      required: false,
      advanced: true,
      refreshers: [],
      options: createStaticDropdown(CHAT_PROVIDERS)
    }),
    include_image: Property.Checkbox({
      displayName: 'Include Image',
      description: 'Sends an image with the prompt. Needs a vision model.',
      required: false,
      defaultValue: false,
      reveals: ['image_url'],
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'Public link to the image.',
      placeholder: 'https://example.com/photo.jpg',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().check(z.minLength(1, 'Provider is required')),
      prompt: z.string().check(z.minLength(1, 'Prompt is required')),
      temperature: z.nullish(z.number().check(z.minimum(0), z.maximum(2))),
      max_completion_tokens: z.nullish(z.number().check(z.minimum(1))),
      image_url: z.nullish(z.string().check(z.url()))
    });

    const {
      provider,
      prompt,
      system_prompt,
      model,
      temperature,
      max_completion_tokens,
      reasoning_effort,
      fallback_providers,
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

    const body: Record<string, any> = {
      providers: provider,
      messages
    };

    const defaultModels: Record<string, string> = {
      'openai': 'gpt-4o',
      'anthropic': 'claude-3-sonnet-latest',
      'google': 'gemini-2.0-flash',
      'meta': 'llama-3.1-70b-instruct',
      'mistral': 'mistral-large-latest',
      'cohere': 'command-r-plus',
      'xai': 'grok-2-latest',
      'amazon': 'nova-pro-v1:0',
      'microsoft': 'gpt-4o',
      'deepseek': 'deepseek-chat',
      'groq': 'llama-3.1-70b-versatile'
    };
    
    body['model'] = model || defaultModels[provider] || 'gpt-4o';

    if (typeof temperature === 'number') body['temperature'] = temperature;
    if (typeof max_completion_tokens === 'number') body['max_completion_tokens'] = max_completion_tokens;
    if (reasoning_effort) body['reasoning_effort'] = reasoning_effort;
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers;
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/llm/chat',
        body
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeChatResponse(provider, response);
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
