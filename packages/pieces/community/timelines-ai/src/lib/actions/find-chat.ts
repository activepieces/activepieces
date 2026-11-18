import { createAction, Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { whatsappAccountDropdown } from '../common/properties';

export const findChat = createAction({
  auth: timelinesAiAuth,
  name: 'findChat',
  classification: 'SEARCH',
  displayName: 'Find Chat',
  description: 'Finds chats that match the filters you add.',
  audience: 'both',
  aiMetadata: { description: 'Searches TimelinesAI WhatsApp chats, optionally filtered by labels, WhatsApp account, name, group/read/closed/autoresponse flags, responsible user, and creation date range; with no filters supplied it returns all chats (paginated). Use to find a chat or its chat_id before sending or closing. Read-only and idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'chat',
      display: 'builder',
      label: 'Chat',
      icon: 'inbox',
      props: ['name', 'whatsapp_account_id', 'label'],
    },
    {
      key: 'status',
      display: 'builder',
      label: 'Status',
      icon: 'filter',
      props: ['closed', 'read', 'group', 'chatgpt_autoresponse_enabled'],
    },
    {
      key: 'people',
      display: 'builder',
      label: 'People',
      icon: 'users',
      props: ['responsible'],
    },
    {
      key: 'time',
      display: 'builder',
      label: 'Created',
      icon: 'calendar',
      props: ['created_after', 'created_before'],
    },
    {
      key: 'results',
      display: 'builder',
      label: 'Results',
      icon: 'sliders',
      props: ['page'],
    },
  ],
  props: {
    label: Property.Array({
      displayName: 'Labels',
      description: 'Only chats with these labels.',
      required: false,
      icon: 'tag',
    }),
    whatsapp_account_id: whatsappAccountDropdown({
      required: false,
      description: 'Only chats on this WhatsApp number.',
      icon: 'inbox',
    }),
    group: Property.Checkbox({
      displayName: 'Group Chat',
      description: 'Only group chats.',
      required: false,
      icon: 'users',
    }),
    responsible: Property.Array({
      displayName: 'Assigned To',
      description: 'Emails of the teammates the chat is assigned to.',
      required: false,
      icon: 'user',
    }),
    name: Property.ShortText({
      displayName: 'Chat Name',
      description: 'Matches part of the chat name.',
      placeholder: 'John Smith',
      required: false,
      icon: 'text',
    }),
    read: Property.Checkbox({
      displayName: 'Read',
      description: 'Only read chats.',
      required: false,
      icon: 'filter',
    }),
    closed: Property.Checkbox({
      displayName: 'Closed',
      description: 'Only closed chats.',
      required: false,
      icon: 'filter',
    }),
    chatgpt_autoresponse_enabled: Property.Checkbox({
      displayName: 'ChatGPT Auto-Reply',
      description: 'Only chats with ChatGPT auto-reply on.',
      required: false,
      icon: 'filter',
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Only chats created after this date.',
      required: false,
      icon: 'calendar',
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Only chats created before this date.',
      required: false,
      icon: 'calendar',
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Results page to return, starting at 1.',
      required: false,
      defaultValue: 1,
      icon: 'sliders',
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const {
      label,
      responsible,
      whatsapp_account_id,
      name,
      created_after,
      created_before,
      page,
      group,
      read,
      closed,
      chatgpt_autoresponse_enabled,
    } = propsValue;
    const chatParams = {
      ...(label && label.length > 0 ? { label: label.join(',') } : {}),
      ...(responsible && responsible.length > 0
        ? { responsible: responsible.join(',') }
        : {}),
      ...(isNonEmptyString(whatsapp_account_id)
        ? { whatsapp_account_id }
        : {}),
      ...(isNonEmptyString(name) ? { name } : {}),
      ...(isNonEmptyString(created_after) ? { created_after } : {}),
      ...(isNonEmptyString(created_before) ? { created_before } : {}),
      ...(typeof page === 'number' ? { page } : {}),
      ...(group === true ? { group } : {}),
      ...(read === true ? { read } : {}),
      ...(closed === true ? { closed } : {}),
      ...(chatgpt_autoresponse_enabled === true
        ? { chatgpt_autoresponse_enabled }
        : {}),
    };
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}
