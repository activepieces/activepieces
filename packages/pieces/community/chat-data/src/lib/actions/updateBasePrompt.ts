import { createAction, Property } from '@activepieces/pieces-framework';
import { ChatDataClient } from '../common/client';
import { UpdateChatbotSettingsDto } from '../common/types';

export const updateBasePrompt = createAction({
  name: 'update_chatbot_settings',
  displayName: 'Update Chatbot Settings',
  description: 'Update comprehensive settings for a chatbot including name, prompts, behavior, and appearance',
  props: {
    chatbotId: Property.Dropdown({
      displayName: 'Chatbot',
      description: 'Select the chatbot to update',
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
    chatbotName: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'Update the name of the chatbot',
      required: false,
    }),
    basePrompt: Property.LongText({
      displayName: 'Base Prompt',
      description: 'Update the base prompt for the chatbot',
      required: false,
    }),
    initialMessages: Property.Array({
      displayName: 'Initial Messages',
      description: 'Array of initial messages to be used by the chatbot',
      required: false,
    }),
    suggestedMessages: Property.Array({
      displayName: 'Suggested Messages',
      description: 'Array of suggested messages shown in the chatbot',
      required: false,
    }),
    visibility: Property.StaticDropdown({
      displayName: 'Visibility',
      description: 'Control whether your chatbot is accessible to others',
      required: false,
      options: {
        options: [
          { label: 'Private', value: 'private' },
          { label: 'Public', value: 'public' },
        ],
      },
    }),
    baseModel: Property.StaticDropdown({
      displayName: 'Base Model',
      description: 'The AI model used in the RAG processing pipeline',
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
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'AI model temperature (0-1, controls randomness)',
      required: false,
    }),
    storeChat: Property.Checkbox({
      displayName: 'Store Chat History',
      description: 'Whether chat history will be stored on the server',
      required: false,
    }),
    trackIpAddress: Property.Checkbox({
      displayName: 'Track IP Address',
      description: 'Whether IP addresses will be stored for conversations and leads',
      required: false,
    }),
    rateLimitPoints: Property.Number({
      displayName: 'Rate Limit Points',
      description: 'Maximum number of messages per timeframe from one device',
      required: false,
    }),
    rateLimitTimeframe: Property.Number({
      displayName: 'Rate Limit Timeframe',
      description: 'Timeframe in seconds for rate limiting',
      required: false,
    }),
    rateLimitMessage: Property.ShortText({
      displayName: 'Rate Limit Message',
      description: 'Error message shown when rate limited',
      required: false,
    }),
    onlyAllowOnAddedDomains: Property.Checkbox({
      displayName: 'Restrict to Added Domains',
      description: 'Only allow the iframe and widget on specific domains',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Allowed Domains',
      description: 'Array of domains where the chatbot is allowed',
      required: false,
    }),
    showCalendar: Property.Checkbox({
      displayName: 'Show Calendar',
      description: 'Display Calendly booking button in the chatbot',
      required: false,
    }),
    calendarUrl: Property.ShortText({
      displayName: 'Calendar URL',
      description: 'Calendly URL for appointment scheduling',
      required: false,
    }),
    calendarMessage: Property.ShortText({
      displayName: 'Calendar Message',
      description: 'Message to display for appointment scheduling',
      required: false,
    }),
    enableBouncingAnimation: Property.Checkbox({
      displayName: 'Enable Bouncing Animation',
      description: 'Whether the chatbot bubble should bounce to attract attention',
      required: false,
    }),
    ignoreDataSource: Property.Checkbox({
      displayName: 'Ignore Data Source',
      description: 'Ignore custom data and act like pure ChatGPT',
      required: false,
    }),
    customBackend: Property.ShortText({
      displayName: 'Custom Backend URL',
      description: 'URL of a custom backend for the chatbot',
      required: false,
    }),
    bearer: Property.ShortText({
      displayName: 'Bearer Token',
      description: 'Authentication token for custom backend',
      required: false,
    }),
  },
  async run(context) {
    const client = new ChatDataClient(context.auth as string);
    
    const payload = UpdateChatbotSettingsDto.parse({
      chatbotId: context.propsValue.chatbotId,
      chatbotName: context.propsValue.chatbotName,
      basePrompt: context.propsValue.basePrompt,
      initialMessages: context.propsValue.initialMessages,
      suggestedMessages: context.propsValue.suggestedMessages,
      visibility: context.propsValue.visibility,
      baseModel: context.propsValue.baseModel,
      temperature: context.propsValue.temperature,
      storeChat: context.propsValue.storeChat,
      trackIpAddress: context.propsValue.trackIpAddress,
      rateLimitPoints: context.propsValue.rateLimitPoints,
      rateLimitTimeframe: context.propsValue.rateLimitTimeframe,
      rateLimitMessage: context.propsValue.rateLimitMessage,
      onlyAllowOnAddedDomains: context.propsValue.onlyAllowOnAddedDomains,
      domains: context.propsValue.domains,
      showCalendar: context.propsValue.showCalendar,
      calendarUrl: context.propsValue.calendarUrl,
      calendarMessage: context.propsValue.calendarMessage,
      enableBouncingAnimation: context.propsValue.enableBouncingAnimation,
      ignoreDataSource: context.propsValue.ignoreDataSource,
      customBackend: context.propsValue.customBackend,
      bearer: context.propsValue.bearer,
    });

    return await client.updateChatbotSettings(payload);
  },
});