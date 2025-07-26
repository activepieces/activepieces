import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { grokApiCall } from '../common/client';
import { grokAuth } from '../common/auth';
import { modelIdDropdown } from '../common/props';

export const askGrokAction = createAction({
  auth: grokAuth,
  name: 'ask_grok',
  displayName: 'Ask Grok (Send Prompt)',
  description:
    'Send a text prompt or image URL to Grok and receive a generated response; supports real-time data from the web.',
  props: {
    model: modelIdDropdown,
    prompt: Property.LongText({
      displayName: 'Prompt',
      description: 'The text prompt to send to Grok.',
      required: true,
    }),
    image_url: Property.ShortText({
      displayName: 'Image URL',
      description: 'An optional URL of an image to include with the prompt.',
      required: false,
    }),
    system_prompt: Property.LongText({
      displayName: 'System Prompt (Persona)',
      description:
        'Optional instructions to define the AI\'s personality or behavior (e.g., "You are a helpful and witty assistant named Jarvis.").',
      required: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description:
        'Controls randomness. Lower values (e.g., 0.2) make the output more deterministic, while higher values (e.g., 1.0) make it more creative. The default is 0.2.',
      required: false,
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate in the response.',
      required: false,
    }),
    top_p: Property.Number({
      displayName: 'Top P',
      description:
        'An alternative to temperature for controlling randomness. The default is 0.9.',
      required: false,
    }),
    seed: Property.Number({
      displayName: 'Seed',
      description:
        'A number to make the output reproducible. If you use the same seed and prompt, you will get the same response.',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const {
      model,
      prompt,
      image_url,
      system_prompt,
      temperature,
      max_tokens,
      top_p,
      seed,
    } = propsValue;

    const messages: any[] = [];

    if (system_prompt) {
      messages.push({ role: 'system', content: system_prompt });
    }

    const userMessageContent: any[] = [{ type: 'text', text: prompt }];

    if (image_url) {
      userMessageContent.push({
        type: 'image_url',
        image_url: { url: image_url },
      });
    }

    messages.push({ role: 'user', content: userMessageContent });

    const requestBody: Record<string, unknown> = {
      model: model,
      messages: messages,
    };

    const optionalParams = {
      temperature,
      max_tokens,
      top_p,
      seed,
    };

    for (const [key, value] of Object.entries(optionalParams)) {
      if (value !== null && value !== undefined) {
        requestBody[key] = value;
      }
    }

    try {
      const response = await grokApiCall({
        method: HttpMethod.POST,
        auth,
        resourceUri: '/chat/completions',
        body: requestBody,
      });

      return response;
    } catch (error: any) {
      if (error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your model selection, prompt format, and other parameters.'
        );
      }

      if (error.message.includes('401') || error.message.includes('403')) {
        throw new Error(
          'Authentication failed or insufficient permissions. Please check your API key and account access.'
        );
      }

      if (error.message.includes('404')) {
        throw new Error(
          'Model or endpoint not found. Please verify the model exists and you have access to it.'
        );
      }

      if (error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }

      throw new Error(`Failed to get response from Grok: ${error.message}`);
    }
  },
});
