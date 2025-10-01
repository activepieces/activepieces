import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { chatDataAuth } from '../../index';
import { chatDataCommon } from '../common';
import { chatbotIdProperty } from '../properties';

export const updateChatbotSettings = createAction({
  auth: chatDataAuth,
  name: 'update_chatbot_settings',
  displayName: 'Update the Base Prompt',
  description: 'Update the base prompt and other settings of a chatbot',
  props: {
    chatbotId: chatbotIdProperty,
    chatbotName: Property.ShortText({
      displayName: 'Chatbot Name',
      description: 'The name of the chatbot',
      required: false,
    }),
    basePrompt: Property.LongText({
      displayName: 'Base Prompt',
      description: 'Base prompt for the chatbot (e.g., "You are a helpful assistant specialized in customer support")',
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
      description: 'Visibility status of the chatbot',
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
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The temperature parameter for the AI model (0.0 to 1.0)',
      required: false,
    }),
    storeChat: Property.Checkbox({
      displayName: 'Store Chat History',
      description: 'Whether the chat history will be stored on the server',
      required: false,
    }),
    trackIpAddress: Property.Checkbox({
      displayName: 'Track IP Address',
      description: 'Whether IP addresses will be stored for conversations and leads',
      required: false,
    }),
    onlyAllowOnAddedDomains: Property.Checkbox({
      displayName: 'Only Allow on Added Domains',
      description: 'Enable or disable only allow the iframe and widget on specific domains',
      required: false,
    }),
    domains: Property.Array({
      displayName: 'Allowed Domains',
      description: 'Array of only allowed domains (when domain restriction is enabled)',
      required: false,
    }),
    rateLimitPoints: Property.Number({
      displayName: 'Rate Limit Points',
      description: 'The limit on the number of messages to be sent from one device',
      required: false,
    }),
    rateLimitTimeframe: Property.Number({
      displayName: 'Rate Limit Timeframe',
      description: 'The timeframe (in seconds) in which the messages limit is applied',
      required: false,
    }),
    rateLimitMessage: Property.ShortText({
      displayName: 'Rate Limit Message',
      description: 'The error message shown when the conversation is rate limited',
      required: false,
    }),
    showCalendar: Property.Checkbox({
      displayName: 'Show Calendar',
      description: 'Whether the Calendly booking button should be displayed',
      required: false,
    }),
    calendarUrl: Property.ShortText({
      displayName: 'Calendar URL',
      description: 'The URL of Calendly for users to schedule appointments',
      required: false,
    }),
    calendarMessage: Property.ShortText({
      displayName: 'Calendar Message',
      description: 'The message to display for appointment scheduling',
      required: false,
    }),
    enableBouncingAnimation: Property.Checkbox({
      displayName: 'Enable Bouncing Animation',
      description: 'Whether the chatbot bubble should bounce to attract attention at session start',
      required: false,
    }),
    ignoreDataSource: Property.Checkbox({
      displayName: 'Ignore Data Source',
      description: 'Whether custom data uploaded by the user should be ignored for chatbot responses',
      required: false,
    }),
    customBackend: Property.ShortText({
      displayName: 'Custom Backend URL',
      description: 'The URL of a customized backend for the chatbot',
      required: false,
    }),
    bearer: Property.ShortText({
      displayName: 'Bearer Token',
      description: 'The authentication bearer token required to access your custom backend',
      required: false,
    }),
  },
  async run(context) {
    const {
      chatbotId,
      chatbotName,
      basePrompt,
      initialMessages,
      suggestedMessages,
      visibility,
      baseModel,
      temperature,
      storeChat,
      trackIpAddress,
      onlyAllowOnAddedDomains,
      domains,
      rateLimitPoints,
      rateLimitTimeframe,
      rateLimitMessage,
      showCalendar,
      calendarUrl,
      calendarMessage,
      enableBouncingAnimation,
      ignoreDataSource,
      customBackend,
      bearer,
    } = context.propsValue;

    const requestBody = {
      chatbotId,
      ...(chatbotName && { chatbotName }),
      ...(basePrompt && { basePrompt }),
      ...(initialMessages && { initialMessages }),
      ...(suggestedMessages && { suggestedMessages }),
      ...(visibility && { visibility }),
      ...(baseModel && { baseModel }),
      ...(temperature !== undefined && { temperature }),
      ...(storeChat !== undefined && { storeChat }),
      ...(trackIpAddress !== undefined && { trackIpAddress }),
      ...(onlyAllowOnAddedDomains !== undefined && { onlyAllowOnAddedDomains }),
      ...(domains && { domains }),
      ...(rateLimitPoints !== undefined && { rateLimitPoints }),
      ...(rateLimitTimeframe !== undefined && { rateLimitTimeframe }),
      ...(rateLimitMessage && { rateLimitMessage }),
      ...(showCalendar !== undefined && { showCalendar }),
      ...(calendarUrl && { calendarUrl }),
      ...(calendarMessage && { calendarMessage }),
      ...(enableBouncingAnimation !== undefined && { enableBouncingAnimation }),
      ...(ignoreDataSource !== undefined && { ignoreDataSource }),
      ...(customBackend && { customBackend }),
      ...(bearer && { bearer }),
    };

    const result = await chatDataCommon.makeRequest({
      apiKey: context.auth,
      method: HttpMethod.POST,
      endpoint: '/update-chatbot-settings',
      body: requestBody,
    });

    return result;
  },
});