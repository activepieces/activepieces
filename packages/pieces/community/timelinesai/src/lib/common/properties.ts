import { Property } from '@activepieces/pieces-framework';
import { timelinesaiCommon } from './client';
import { TimelinesaiAuth } from './auth';

const whatsappAccountDropdown = () =>
  Property.Dropdown({
    displayName: 'WhatsApp Account',
    description: 'Select the WhatsApp account',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your TimelinesAI account first',
          options: [],
        };
      }

      try {
        const authTyped = auth as TimelinesaiAuth;
        const accounts = await timelinesaiCommon.getWhatsAppAccounts({ auth: authTyped }) as any[];

        if (!accounts || accounts.length === 0) {
          return {
            disabled: true,
            placeholder: 'No WhatsApp accounts found',
            options: [],
          };
        }

        return {
          options: accounts.map((account: any) => ({
            label: account.name || account.phone_number || `Account ${account.id}`,
            value: account.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load WhatsApp accounts',
          options: [],
        };
      }
    },
  });

const chatDropdown = () =>
  Property.Dropdown({
    displayName: 'Chat',
    description: 'Select the chat',
    required: true,
    refreshers: ['auth'],
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          placeholder: 'Connect your TimelinesAI account first',
          options: [],
        };
      }

      try {
        const authTyped = auth as TimelinesaiAuth;
        const chats = await timelinesaiCommon.getChats({ auth: authTyped, limit: 100 }) as any[];

        if (!chats || chats.length === 0) {
          return {
            disabled: true,
            placeholder: 'No chats found',
            options: [],
          };
        }

        return {
          options: chats.map((chat: any) => ({
            label: chat.name || chat.phone_number || `Chat ${chat.id}`,
            value: chat.id,
          })),
        };
      } catch (error) {
        return {
          disabled: true,
          placeholder: 'Failed to load chats',
          options: [],
        };
      }
    },
  });

// Action Properties
export const sendMessageToExistingChat = () => ({
  chat_id: chatDropdown(),
  message: Property.LongText({
    displayName: 'Message',
    description: 'The message content to send',
    required: true,
  }),
  message_type: Property.StaticDropdown({
    displayName: 'Message Type',
    description: 'Type of message (default: text)',
    required: false,
    options: {
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Document', value: 'document' },
        { label: 'Location', value: 'location' },
        { label: 'Contact', value: 'contact' },
      ],
    },
  }),
});

export const sendFileToExistingChat = () => ({
  chat_id: chatDropdown(),
  file_url: Property.ShortText({
    displayName: 'File URL',
    description: 'URL of the file to send (leave empty if uploading file directly)',
    required: false,
  }),
  file: Property.File({
    displayName: 'File',
    description: 'File to upload and send (leave empty if using URL)',
    required: false,
  }),
  filename: Property.ShortText({
    displayName: 'Filename',
    description: 'Custom filename for the file',
    required: false,
  }),
  caption: Property.ShortText({
    displayName: 'Caption',
    description: 'Caption for the file',
    required: false,
  }),
});

const uploadedFileIdInput = () =>
  Property.ShortText({
    displayName: 'File ID',
    description: 'The ID of the uploaded file to send',
    required: true,
  });

export const sendUploadedFileToExistingChat = () => ({
  chat_id: chatDropdown(),
  file_id: uploadedFileIdInput(),
  filename: Property.ShortText({
    displayName: 'Filename',
    description: 'Custom filename for the file (optional)',
    required: false,
  }),
  caption: Property.ShortText({
    displayName: 'Caption',
    description: 'Caption for the file',
    required: false,
  }),
});

export const sendMessageToNewChat = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    description: 'Phone number in international format (e.g., +1234567890)',
    required: true,
  }),
  message: Property.LongText({
    displayName: 'Message',
    description: 'The message content to send',
    required: true,
  }),
  message_type: Property.StaticDropdown({
    displayName: 'Message Type',
    description: 'Type of message (default: text)',
    required: false,
    options: {
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Audio', value: 'audio' },
        { label: 'Document', value: 'document' },
        { label: 'Location', value: 'location' },
        { label: 'Contact', value: 'contact' },
      ],
    },
  }),
});

export const closeChat = () => ({
  chat_id: chatDropdown(),
});

export const findChat = () => ({
  chat_id: Property.ShortText({
    displayName: 'Chat ID',
    description: 'Specific chat ID to find (optional)',
    required: false,
  }),
  whatsapp_account_id: whatsappAccountDropdown(),
  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    description: 'Phone number to filter chats (optional)',
    required: false,
  }),
  name: Property.ShortText({
    displayName: 'Chat Name',
    description: 'Chat name to search for (optional)',
    required: false,
  }),
  status: Property.StaticDropdown({
    displayName: 'Status',
    description: 'Filter by chat status (optional)',
    required: false,
    options: {
      options: [
        { label: 'Open', value: 'open' },
        { label: 'Closed', value: 'closed' },
        { label: 'Archived', value: 'archived' },
      ],
    },
  }),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results (default: 50, max: 100)',
    required: false,
  }),
  offset: Property.Number({
    displayName: 'Offset',
    description: 'Number of results to skip (default: 0)',
    required: false,
  }),
});

export const findMessage = () => ({
  message_id: Property.ShortText({
    displayName: 'Message ID',
    description: 'WhatsApp message ID to find',
    required: true,
  }),
});

export const findUploadedFile = () => ({
  file_id: Property.ShortText({
    displayName: 'File ID',
    description: 'Specific file ID to find (optional)',
    required: false,
  }),
  filename: Property.ShortText({
    displayName: 'Filename',
    description: 'Filename to search for (optional)',
    required: false,
  }),
  chat_id: chatDropdown(),
  limit: Property.Number({
    displayName: 'Limit',
    description: 'Maximum number of results (default: 50, max: 100)',
    required: false,
  }),
  offset: Property.Number({
    displayName: 'Offset',
    description: 'Number of results to skip (default: 0)',
    required: false,
  }),
});

export const findMessageStatus = () => ({
  message_id: Property.ShortText({
    displayName: 'Message ID',
    description: 'WhatsApp message ID to check status for',
    required: true,
  }),
});

export const findWhatsAppAccount = () => ({
  whatsapp_account_id: Property.ShortText({
    displayName: 'WhatsApp Account ID',
    description: 'Specific account ID to find (optional)',
    required: false,
  }),
  phone_number: Property.ShortText({
    displayName: 'Phone Number',
    description: 'Phone number to filter accounts (optional)',
    required: false,
  }),
});

// Trigger Properties
export const newIncomingChat = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
});

export const newOutgoingChat = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
});

export const chatClosed = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
});

export const newSentMessage = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
  chat_id: chatDropdown(),
});

export const newReceivedMessage = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
  chat_id: chatDropdown(),
});

export const newUploadedFile = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
  chat_id: chatDropdown(),
});

export const chatRenamed = () => ({
  whatsapp_account_id: whatsappAccountDropdown(),
});

export const newWhatsAppAccount = () => ({
  // No specific properties needed
});
