import { Property } from '@activepieces/pieces-framework';
import { timelinesAiClient } from './client';
import { TimelinesAiAuthType } from './types';

export const timelinesAiProps = {
  chatId: Property.Dropdown({
    displayName: 'Chat',
    description: 'The chat to send the message to.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      try {
        const chats = await timelinesAiClient.getChats(
          auth as TimelinesAiAuthType
        );
        return {
          disabled: false,
          options: chats.map((chat) => ({
            label: chat.name,
            value: chat.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error fetching chats. Check connection and token.',
          options: [],
        };
      }
    },
  }),
  whatsappAccountPhone: Property.Dropdown({
    displayName: 'From WhatsApp Account',
    description: 'The connected WhatsApp account to send the message from.',
    required: true,
    refreshers: [],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Please connect your account first',
          options: [],
        };
      }
      try {
        const accounts = await timelinesAiClient.getWhatsAppAccounts(
          auth as TimelinesAiAuthType
        );
        return {
          disabled: false,
          options: accounts.map((account) => ({
            label: `${account.name} (${account.phone})`,
            value: account.phone,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Error fetching accounts.',
          options: [],
        };
      }
    },
  }),
};
