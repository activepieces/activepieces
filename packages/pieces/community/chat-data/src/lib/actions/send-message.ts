import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';
import { chatbotIdProperty } from '../properties';

export const sendMessage = createAction({
  auth: chatDataAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send a message to a chatbot and receive a response',
  props: {
    chatbotId: chatbotIdProperty,
    message: Property.LongText({
      displayName: 'Message',
      description: 'The message to send to the chatbot',
      required: true,
    }),
    conversationId: Property.ShortText({
      displayName: 'Conversation ID',
      description: 'ID of the current conversation. Leave empty to start a new conversation.',
      required: false,
    }),
    includeReasoning: Property.Checkbox({
      displayName: 'Include Reasoning',
      description: 'Include reasoning in the response (overrides chatbot settings)',
      required: false,
      defaultValue: false,
    }),
    baseModel: Property.StaticDropdown({
      displayName: 'Base Model',
      description: 'Override the chatbot\'s base model for this request',
      required: false,
      options: {
        options: [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
          { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
          { label: 'GPT-4.1', value: 'gpt-4.1' },
          { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
          { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
          { label: 'GPT-5', value: 'gpt-5' },
          { label: 'GPT-o1', value: 'gpt-o1' },
          { label: 'GPT-o3 Mini', value: 'gpt-o3-mini' },
          { label: 'GPT-o3', value: 'gpt-o3' },
          { label: 'GPT-o4 Mini', value: 'gpt-o4-mini' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
          { label: 'Claude 3.7 Sonnet', value: 'claude-3-7-sonnet' },
          { label: 'Claude 4 Sonnet', value: 'claude-4-sonnet' },
          { label: 'Claude 4.5 Sonnet', value: 'claude-4-5-sonnet' },
          { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku' },
          { label: 'Claude 3 Haiku', value: 'claude-3-haiku' },
          { label: 'Claude 4 Opus', value: 'claude-4-opus' },
          { label: 'Claude 4.1 Opus', value: 'claude-4.1-opus' },
          { label: 'Gemini 2.5 Flash', value: 'gemini-2.5-flash' },
          { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
          { label: 'Gemini 1.5 Flash', value: 'gemini-1.5-flash' },
          { label: 'Gemini 2.5 Pro', value: 'gemini-2.5-pro' },
          { label: 'DeepSeek R1', value: 'deepseek-r1' },
        ],
      },
    }),
    basePrompt: Property.LongText({
      displayName: 'Base Prompt',
      description: 'Override the chatbot\'s base prompt for this request',
      required: false,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream Response',
      description: 'Whether to stream back partial progress or wait for the full response',
      required: false,
      defaultValue: false,
    }),
    openAIFormat: Property.Checkbox({
      displayName: 'OpenAI Format',
      description: 'Format response to be compatible with OpenAI\'s API format',
      required: false,
      defaultValue: false,
    }),
    appendMessages: Property.Checkbox({
      displayName: 'Append Messages',
      description: 'If true, append to previous messages with the same conversationId. If false, treat as complete message history.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const {
      chatbotId,
      message,
      conversationId,
      includeReasoning,
      baseModel,
      basePrompt,
      stream,
      openAIFormat,
      appendMessages,
    } = context.propsValue;

    const messages = [
      {
        role: 'user',
        content: message,
      },
    ];

    const requestBody = {
      messages,
      chatbotId,
      ...(conversationId && { conversationId }),
      ...(includeReasoning !== undefined && { includeReasoning }),
      ...(baseModel && { baseModel }),
      ...(basePrompt && { basePrompt }),
      ...(stream !== undefined && { stream }),
      ...(openAIFormat !== undefined && { openAIFormat }),
      ...(appendMessages !== undefined && { appendMessages }),
    };

    const result = await chatDataCommon.makeRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/chat',
      body: requestBody,
    });

    return result;
  },
});