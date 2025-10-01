import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { SendMessageDto } from '../common/types';

export const sendMessage = createAction({
  name: 'send_message',
  displayName: 'Send Message to Chatbot',
  description:
    'Send messages to a chatbot and receive a response with support for streaming and OpenAI-compatible formats',
  props: {
    chatbotId: Property.Dropdown({
      displayName: 'Chatbot',
      description: 'Select the chatbot to send message to',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const client = new ChatDataClient(auth as string);
          const chatbots = await client.listChatbots();
          return {
            options: chatbots.map((chatbot) => ({
              label: chatbot.name,
              value: chatbot.id,
            })),
          };
        } catch (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load chatbots',
          };
        }
      },
    }),
    messageContent: Property.LongText({
      displayName: 'Message Content',
      description: 'The text content of the message to send',
      required: true,
    }),
    messageRole: Property.StaticDropdown({
      displayName: 'Message Role',
      description: 'The role of the message sender',
      required: false,
      defaultValue: 'user',
      options: {
        options: [
          { label: 'User', value: 'user' },
          { label: 'Assistant', value: 'assistant' },
        ],
      },
    }),
    conversationId: Property.Dropdown({
      displayName: 'Conversation',
      description:
        'Select an existing conversation or leave empty to start a new one',
      required: false,
      refreshers: ['chatbotId'],
      options: async ({ auth, chatbotId }) => {
        if (!auth || !chatbotId) {
          return {
            disabled: true,
            options: [{ label: 'New Conversation', value: '' }],
            placeholder: 'Select a chatbot first',
          };
        }
        try {
          const client = new ChatDataClient(auth as string);
          const conversations = await client.listConversations(
            chatbotId as string
          );
          return {
            options: [
              { label: 'New Conversation', value: '' },
              ...conversations.map((conversation) => ({
                label:
                  conversation.title ||
                  `Conversation ${conversation.id.slice(-8)}`,
                value: conversation.id,
              })),
            ],
          };
        } catch (error) {
          return {
            disabled: true,
            options: [{ label: 'New Conversation', value: '' }],
            placeholder: 'Failed to load conversations',
          };
        }
      },
    }),
    includeReasoning: Property.Checkbox({
      displayName: 'Include Reasoning',
      description:
        'Include reasoning in the response (overrides chatbot settings)',
      required: false,
    }),
    baseModel: Property.StaticDropdown({
      displayName: 'Base Model',
      description: "Override the chatbot's base model for this request",
      required: false,
      options: {
        options: [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4', value: 'gpt-4' },
          { label: 'Claude 3.5 Sonnet', value: 'claude-3-5-sonnet' },
          { label: 'Claude 3.5 Haiku', value: 'claude-3-5-haiku' },
          { label: 'Gemini 2.0 Flash', value: 'gemini-2.0-flash' },
          { label: 'DeepSeek R1', value: 'deepseek-r1' },
        ],
      },
    }),
    basePrompt: Property.LongText({
      displayName: 'Base Prompt Override',
      description: "Override the chatbot's base prompt for this request",
      required: false,
    }),
    stream: Property.Checkbox({
      displayName: 'Stream Response',
      description:
        'Stream back partial progress instead of waiting for full response',
      required: false,
    }),
    openAIFormat: Property.Checkbox({
      displayName: 'OpenAI Format',
      description: 'Return response in OpenAI-compatible format',
      required: false,
    }),
    appendMessages: Property.Checkbox({
      displayName: 'Append to Conversation',
      description:
        'Append this message to previous messages with the same conversationId',
      required: false,
    }),
    attachedFiles: Property.Array({
      displayName: 'Attached Files',
      description: 'Files to attach to the message (max 3 files)',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth as string);

    const messages = [
      {
        role: context.propsValue.messageRole || 'user',
        content: context.propsValue.messageContent,
        files: context.propsValue.attachedFiles || undefined,
      },
    ];

    const payload = SendMessageDto.parse({
      messages,
      chatbotId: context.propsValue.chatbotId,
      conversationId: context.propsValue.conversationId,
      includeReasoning: context.propsValue.includeReasoning,
      baseModel: context.propsValue.baseModel,
      basePrompt: context.propsValue.basePrompt,
      stream: context.propsValue.stream || false,
      openAIFormat: context.propsValue.openAIFormat || false,
      appendMessages: context.propsValue.appendMessages || false,
    });

    return await client.sendMessage(payload);
  },
});
