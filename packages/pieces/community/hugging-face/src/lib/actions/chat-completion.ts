import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';

export const chatCompletion = createAction({
  name: 'chat_completion',
  auth: huggingFaceAuth,
  displayName: 'Chat Completion',
  description: 'Generate assistant replies using a chat-style LLM on Hugging Face',
  props: {
    model: Property.ShortText({
      displayName: 'Model',
      description: 'Hugging Face chat completion model to use',
      required: true,
      defaultValue: 'microsoft/DialoGPT-medium',
    }),
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Array of conversation messages',
      required: true,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      required: false,
      defaultValue: 100,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Sampling temperature (0.0 to 2.0)',
      required: false,
      defaultValue: 0.7,
    }),
  },
  async run(context) {
    const { apiKey, baseUrl } = context.auth;
    const { model, messages, maxTokens, temperature } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/models/${model}`,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: {
        inputs: messages,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: temperature,
          do_sample: true,
        },
      },
    });

    return response.body;
  },
}); 