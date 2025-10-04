import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';

export const createChatbot = createAction({
  auth: chatDataAuth,
  name: 'create_chatbot',
  displayName: 'Create Chatbot',
  description: 'Create a new chatbot in Chat Data',
  props: {
    name: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'The name of the chatbot',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'A description of what the chatbot does',
      required: false,
    }),
    instructions: Property.LongText({
      displayName: 'Instructions',
      description: 'Instructions for how the chatbot should behave',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'AI Model',
      description: 'The AI model to use for the chatbot',
      required: false,
      defaultValue: 'gpt-3.5-turbo',
      options: {
        options: [
          { label: 'GPT-3.5 Turbo', value: 'gpt-3.5-turbo' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' },
        ],
      },
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness in responses (0.0 to 1.0)',
      required: false,
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens in the response',
      required: false,
      defaultValue: 1000,
    }),
  },
  async run(context) {
    const { name, description, instructions, model, temperature, maxTokens } = context.propsValue;
    
    const requestBody = {
      name,
      ...(description && { description }),
      ...(instructions && { instructions }),
      ...(model && { model }),
      ...(temperature !== undefined && { temperature }),
      ...(maxTokens && { max_tokens: maxTokens }),
    };

    const result = await chatDataCommon.makeRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/chatbots',
      body: requestBody,
    });

    return result;
  },
});