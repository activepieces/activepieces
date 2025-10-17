import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { whatsappAccountDropdown } from '../common/properties';

export const findChat = createAction({
  auth: timelinesAiAuth,
  name: 'findChat',
  displayName: 'Find Chat',
  description:
    'Look up a chat by parameters such as chat_id, phone, name, etc.',
  props: {
    label: Property.Array({
      displayName: 'Labels',
      description: 'Filter by labels assigned to the chat',
      required: false,
    }),
    whatsapp_account_id: whatsappAccountDropdown({ required: false }),
    group: Property.Checkbox({
      displayName: 'Is Group',
      description: 'Filter by whether the chat is a group chat',
      required: false,
    }),
    responsible: Property.Array({
      displayName: 'Responsible',
      description: 'Filter by the user responsible for the chat (email)',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Chat Name',
      description: 'Filter by the name of the chat',
      required: false,
    }),
    read: Property.Checkbox({
      displayName: 'Is Read',
      description: 'Filter by whether the chat is marked as read',
      required: false,
    }),
    closed: Property.Checkbox({
      displayName: 'Is Closed',
      description: 'Filter by whether the chat is closed',
      required: false,
    }),
    chatgpt_autoresponse_enabled: Property.Checkbox({
      displayName: 'ChatGPT Autoresponse Enabled',
      description:
        'Filter by whether ChatGPT autoresponse is enabled for the chat',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Filter chats created after this date',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Filter chats created before this date',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number for paginated results',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { label, responsible, ...rest } = propsValue;
    const chatParams = {
      ...(label?.length && label.length > 0 ? { label: label.join(',') } : {}),
      ...(responsible?.length && responsible.length > 0
        ? { responsible: responsible.join(',') }
        : {}),
      ...rest,
    };
    console.log('Chat search parameters:', chatParams);
    const response = await timelinesAiCommon.getChats({
      apiKey,
      ...chatParams,
    });
    if (response.status !== 'ok') {
      throw new Error(
        `Error fetching chat: ${response.message || 'Unknown error'}`
      );
    }
    return response.data;
  },
});
