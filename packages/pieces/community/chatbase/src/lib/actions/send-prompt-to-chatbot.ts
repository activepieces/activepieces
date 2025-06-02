import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common';
import { chatbaseAuth } from '../../index';
import { chatbotIdDropdown } from '../common/props';

export const sendPromptToChatbotAction = createAction({
  auth: chatbaseAuth,
  name: 'message_chatbot',
  displayName: 'Send Prompt to Chatbot',
  description: 'Sends a prompt to the chatbot to generate a response.',
  props: {
    chatbotId: chatbotIdDropdown,
    messages: Property.Json({
      displayName: 'Messages',
      description: 'Array of chat messages with `role` and `content`. Include full conversation history.',
      required: true,
    }),

    stream: Property.Checkbox({
      displayName: 'Stream (SSE)',
      description: 'Return a streamed response instead of a full response.',
      required: false,
      defaultValue: false,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Higher values = more random output. Between 0 and 1.',
      required: false,
      defaultValue: 0,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'Unique ID for saving this conversation in Chatbase dashboard.',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model (Optional)',
      required: false,
      options: {
        options: [
          { label: 'gpt-4', value: 'gpt-4' },
          { label: 'gpt-4o', value: 'gpt-4o' },
          { label: 'gpt-4o-mini', value: 'gpt-4o-mini' },
          { label: 'gpt-4.1', value: 'gpt-4.1' },
          { label: 'gpt-4.5', value: 'gpt-4.5' },
          { label: 'claude-opus-4', value: 'claude-opus-4' },
          { label: 'claude-3-haiku', value: 'claude-3-haiku' },
          { label: 'gemini-2.0-pro', value: 'gemini-2.0-pro' },
          { label: 'command-r', value: 'command-r' },
          { label: 'DeepSeek-V3', value: 'DeepSeek-V3' },
          { label: 'Llama-4-Scout-17B-16E-Instruct', value: 'Llama-4-Scout-17B-16E-Instruct' },
          { label: 'grok-3', value: 'grok-3' },
        ],
      },
    }),
  },

  async run(context) {
    const {
      chatbotId,
      messages,
      stream,
      temperature,
      model,
      conversationId,
    } = context.propsValue;

    const apiKey = context.auth as string;

    const payload: Record<string, any> = {
      chatbotId,
      messages,
    };

    if (stream !== undefined) payload['stream'] = stream;
    if (temperature !== undefined) payload['temperature'] = temperature;
    if (conversationId) payload['conversationId'] = conversationId;
    if (model) payload['model'] = model;

    const response = await makeRequest(
      apiKey,
      HttpMethod.POST,
      '/chat',
      payload
    );

    return response;
  },
});
