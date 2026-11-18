import { Property } from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '.';

export const chatDropdown = ({
  description = 'The chat to use.',
  required = true,
}: {
  description?: string;
  required?: boolean;
}) =>
  Property.Dropdown({
    auth: timelinesAiAuth,
    displayName: 'Chat',
    description,
    required,
    refreshers: ['auth'],
    refreshOnSearch: true,
    options: async ({ auth: apiKey }, { searchValue }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Connect your TimelinesAI account first',
          options: [],
        };
      }
      try {
        const response = await timelinesAiCommon.getChats({
          apiKey,
          ...(searchValue ? { name: searchValue } : {}),
        });
        const { chats } = response.data;
        if (chats.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No chats found.',
          };
        }
        return {
          options: chats.map((chat) => ({
            label: chat.phone ? `${chat.name} (${chat.phone})` : chat.name,
            value: chat.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load chats. Check your connection.',
        };
      }
    },
  });

export const whatsappAccountDropdown = ({
  required = true,
  description = 'The connected WhatsApp number to use.',
  icon,
}: {
  required?: boolean;
  description?: string;
  icon?: 'text' | 'code' | 'markdown' | 'reply' | 'reply-all' | 'users' | 'user' | 'send' | 'type' | 'file' | 'paperclip' | 'location' | 'tag' | 'inbox' | 'calendar' | 'trash' | 'filter' | 'sliders' | 'blank';
}) =>
  Property.Dropdown({
    auth: timelinesAiAuth,
    displayName: 'WhatsApp Account',
    description,
    required,
    ...(icon ? { icon } : {}),
    refreshers: ['auth'],
    options: async ({ auth: apiKey }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Connect your TimelinesAI account first',
          options: [],
        };
      }
      try {
        const response = await timelinesAiCommon.listWhatsappAccounts({
          apiKey,
        });
        const accounts = response.data.whatsapp_accounts;
        if (accounts.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No WhatsApp accounts connected.',
          };
        }
        return {
          options: accounts.map((account) => ({
            label: account.phone
              ? `${account.account_name} (${account.phone})`
              : account.account_name,
            value: account.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load WhatsApp accounts. Check your connection.',
        };
      }
    },
  });

export const fileDropdown = ({ required = true }) =>
  Property.Dropdown({
    auth: timelinesAiAuth,
    displayName: 'Uploaded File',
    description: 'A file already uploaded to TimelinesAI.',
    required,
    refreshers: ['auth'],
    options: async ({ auth: apiKey }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Connect your TimelinesAI account first',
          options: [],
        };
      }
      try {
        const response = await timelinesAiCommon.listUploadedFiles({
          apiKey,
        });
        const files = response.data;
        if (files.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No uploaded files found.',
          };
        }
        return {
          options: files.map((file) => ({
            label: file.filename,
            value: file.uid,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load files. Check your connection.',
        };
      }
    },
  });
