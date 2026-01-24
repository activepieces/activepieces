import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { chatDataAuth, SendMessageDto } from '../common/types';

export const sendMessage = createAction({
  name: 'send_message',
  displayName: 'Send Message to Chatbot',
  description:
    'Send messages to a chatbot and receive a response with support for streaming and OpenAI-compatible formats',
  auth: chatDataAuth,
  props: {
    chatbotId: Property.Dropdown({
      displayName: 'Chatbot',
      description: 'Select the chatbot to send message to',
      required: true,
      refreshers: [],
      auth: chatDataAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        try {
          const client = new ChatDataClient(auth.secret_text);
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
      auth: chatDataAuth,
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
          const client = new ChatDataClient(auth.secret_text);
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
          { label: 'GPT-4.1 Nano', value: 'gpt-4.1-nano' },
          { label: 'GPT-4.1 Mini', value: 'gpt-4.1-mini' },
          { label: 'GPT-4.1', value: 'gpt-4.1' },
          { label: 'GPT-5 Nano', value: 'gpt-5-nano' },
          { label: 'GPT-5 Mini', value: 'gpt-5-mini' },
          { label: 'GPT-5', value: 'gpt-5' },
          { label: 'GPT-O1', value: 'gpt-o1' },
          { label: 'GPT-O3 Mini', value: 'gpt-o3-mini' },
          { label: 'GPT-O3', value: 'gpt-o3' },
          { label: 'GPT-O4 Mini', value: 'gpt-o4-mini' },
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
      displayName: 'Base Prompt Override',
      description: "Override the chatbot's base prompt for this request",
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
      properties: {
        name: Property.ShortText({
          displayName: 'File Name',
          description: 'The name of the attached file',
          required: true,
        }),
        type: Property.StaticDropdown({
          displayName: 'File Type',
          description: 'The MIME type of the file',
          required: true,
          options: {
            options: [
              { label: 'PDF', value: 'application/pdf' },
              { label: 'Word Document', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
              { label: 'HTML', value: 'text/html' },
              { label: 'Plain Text', value: 'text/plain' },
              { label: 'PNG Image', value: 'image/png' },
              { label: 'JPG Image', value: 'image/jpg' },
              { label: 'JPEG Image', value: 'image/jpeg' },
              { label: 'WebP Image', value: 'image/webp' },
            ],
          },
        }),
        url: Property.ShortText({
          displayName: 'File URL',
          description: 'Publicly accessible URL where the file is hosted',
          required: true,
        }),
        content: Property.LongText({
          displayName: 'File Content (Optional)',
          description: 'Pre-parsed textual content. If provided, file won\'t be downloaded. Required for files > 3MB.',
          required: false,
        }),
      },
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth.secret_text);

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
      stream: false,
      openAIFormat: context.propsValue.openAIFormat || false,
      appendMessages: context.propsValue.appendMessages || false,
    });

    return await client.sendMessage(payload);
  },
});
