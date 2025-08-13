import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { huggingFaceAuth } from '../auth';

export const chatCompletion = createAction({
  name: 'chat_completion',
  auth: huggingFaceAuth,
  displayName: 'Chat Completion',
  description: 'Generate AI responses using chat-style language models',
  props: {
    messages: Property.Array({
      displayName: 'Messages',
      description: 'Array of messages in the conversation',
      required: true,
      properties: {
        role: Property.StaticDropdown({
          displayName: 'Role',
          description: 'The role of the message sender',
          required: true,
          options: {
            options: [
              { label: 'System', value: 'system' },
              { label: 'User', value: 'user' },
              { label: 'Assistant', value: 'assistant' },
            ],
          },
        }),
        content: Property.LongText({
          displayName: 'Content',
          description: 'The content of the message',
          required: true,
        }),
      },
    }),
    maxTokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum number of tokens to generate',
      required: false,
      defaultValue: 1000,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls randomness (0.0 = deterministic, 1.0 = very random)',
      required: false,
      defaultValue: 0.7,
    }),
    topP: Property.Number({
      displayName: 'Top P',
      description: 'Nucleus sampling parameter (0.0 to 1.0)',
      required: false,
      defaultValue: 0.9,
    }),
    model: Property.ShortText({
      displayName: 'Model (Optional)',
      description: 'Specific chat model to use (overrides auth model)',
      required: false,
    }),
  },
  async run(context) {
    const model = context.propsValue.model || context.auth.model;
    const accessToken = context.auth.accessToken;
    
    const parameters: any = {};
    
    if (context.propsValue.maxTokens) {
      parameters.max_new_tokens = context.propsValue.maxTokens;
    }
    if (context.propsValue.temperature !== undefined) {
      parameters.temperature = context.propsValue.temperature;
    }
    if (context.propsValue.topP !== undefined) {
      parameters.top_p = context.propsValue.topP;
    }
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: context.propsValue.messages,
        parameters,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    return result;
  },
}); 