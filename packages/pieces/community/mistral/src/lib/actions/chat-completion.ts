import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { Mistral } from '@mistralai/mistralai';
import { mistralAuth } from '../..';

export const createChatCompletion = createAction({
  auth: mistralAuth,
  name: 'create_chat_completion',
  displayName: 'Create Chat Completion',
  description: 'Generate text completion from conversational prompts',
  props: {
    model: Property.Dropdown({
      displayName: 'Model',
      required: true,
      description: 'The model to use for completion',
      refreshers: [],
      defaultValue: 'mistral-tiny',
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Enter your API key first',
            options: [],
          };
        }
        try {
          const client = new Mistral({
            apiKey: auth,
          });
          const response = await client.models.list();
          return {
            disabled: false,
            options: response.data.map((model) => {
              return {
                label: model.id,
                value: model.id,
              };
            }),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: "Couldn't load models, API key is invalid",
          };
        }
      },
    }),
    messages: Property.Json({
      displayName: 'Messages',
      required: true,
      description: 'Array of message objects with role and content',
      defaultValue: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Hello!' },
      ],
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      required: false,
      description:
        'Controls randomness. Lower values make output more focused and deterministic.',
      defaultValue: 0.7,
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      required: false,
      description: 'The maximum number of tokens to generate',
    }),
    topP: Property.Number({
      displayName: 'Top P',
      required: false,
      description:
        'Nucleus sampling: consider tokens with top_p probability mass',
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new Mistral({
      apiKey: auth,
    });

    const {
      model,
      messages,
      temperature,
      maxTokens,
      topP,
    } = propsValue;

    const messagesArray = Array.isArray(messages) ? messages : [messages];

    const response = await client.chat.complete({
      model: model,
      messages: messagesArray,
      temperature: temperature,
      maxTokens: maxTokens,
      topP: topP,
    });


    return response.choices?.[0]?.message?.content || '';
  },
});
