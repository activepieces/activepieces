import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const CHAT_PROVIDERS = [
  { label: 'OpenAI GPT-4o', value: 'openai' },
  { label: 'Anthropic Claude', value: 'anthropic' },
  { label: 'Google Gemini', value: 'google' },
  { label: 'Meta Llama', value: 'meta' },
  { label: 'Mistral', value: 'mistral' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'XAI Grok', value: 'xai' },
  { label: 'Amazon Nova', value: 'amazon' },
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
  name: 'generate_text',
  displayName: 'Generate Text',
  description:
    'Generate text completions using various AI providers through Eden AI chat endpoint.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for text generation.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(CHAT_PROVIDERS)
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
    model: Property.ShortText({
      displayName: 'Model',
      description:
        'Specific model to use (e.g., gpt-4o, claude-3-sonnet-latest, gemini-2.0-flash). Leave empty for provider-specific defaults.',
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
      displayName: 'Reasoning Effort',
      description: 'Level of reasoning depth for the response.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(REASONING_EFFORT_OPTIONS)
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(CHAT_PROVIDERS)
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
      provider: z.string().min(1, 'Provider is required'),
      prompt: z.string().min(1, 'Prompt is required'),
      temperature: z.number().min(0).max(2).nullish(),
      max_completion_tokens: z.number().min(1).nullish(),
      image_url: z.string().url().nullish()
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

    if (temperature !== undefined) body['temperature'] = temperature;
    if (max_completion_tokens !== undefined) body['max_completion_tokens'] = max_completion_tokens;
    if (reasoning_effort) body['reasoning_effort'] = reasoning_effort;
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers;
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
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
