import { Property } from '@activepieces/pieces-framework';
import { timelinesAiCommon } from '.';

export const chatDropdown = ({
  description = 'Select the chat to send the message to',
  required = true,
}: {
  description?: string;
  required?: boolean;
}) =>
  Property.Dropdown({
    displayName: 'Chat',
    description: description,
    required,
    refreshers: ['auth'],
    refreshOnSearch: true,
    options: async ({ auth: apiKey }, { searchValue }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Please select an authentication first',
          options: [],
        };
      }
      const response = await timelinesAiCommon.getChats({
        apiKey: apiKey as string,
        name: searchValue,
      });
      const { chats } = response.data;
      return {
        options: chats.map((chat) => ({
          label: chat.name,
          value: chat.id,
        })),
      };
    },
  });

export const whatsappAccountDropdown = ({ required = true }) =>
  Property.Dropdown({
    displayName: 'WhatsApp Account',
    description: 'Select the WhatsApp account',
    required,
    refreshers: ['auth'],
    options: async ({ auth: apiKey }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Please select an authentication first',
          options: [],
        };
      }
      const response = await timelinesAiCommon.listWhatsappAccounts({
        apiKey: apiKey as string,
      });
      const accounts = response.data;
      return {
        options: accounts.whatsapp_accounts.map((account) => ({
          label: account.account_name,
          value: account.id,
        })),
      };
    },
  });

export const fileDropdown = ({ required = true }) =>
  Property.Dropdown({
    displayName: 'Uploaded File',
    description: 'Select the uploaded file',
    required,
    refreshers: ['auth'],
    options: async ({ auth: apiKey }) => {
      if (!apiKey) {
        return {
          disabled: true,
          placeholder: 'Please select an authentication first',
          options: [],
        };
      }
      const response = await timelinesAiCommon.listUploadedFiles({
        apiKey: apiKey as string,
      });
      const files = response.data;
      return {
        options: files.map((file) => ({
          label: file.filename,
          value: file.uid,
        })),
      };
    },
  });
