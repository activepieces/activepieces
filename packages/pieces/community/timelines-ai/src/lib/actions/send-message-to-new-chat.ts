import {
  ApFile,
  createAction,
  DynamicPropsValue,
  MarkdownVariant,
  Property,
} from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { whatsappAccountDropdown } from '../common/properties';
import { AuthenticationParams } from '../common/types';

export const sendMessageToNewChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendMessageToNewChat',
  classification: 'WRITE',
  displayName: 'Send Message to New Chat',
  description:
    'Starts a chat with a phone number or WhatsApp ID and sends a message.',
  audience: 'both',
  aiMetadata: { description: 'Starts a new TimelinesAI WhatsApp conversation by addressing a contact either by phone number or by WhatsApp JID (selected via Contact Type), then sending an initial text and/or file. Use to message someone you do not yet have a chat_id for; use Send Message to Existing Chat when you already have the chat_id. Not idempotent: each call sends a message and may create a new chat.', idempotent: false },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send to',
      icon: 'send',
      props: ['contactType', 'contact', 'whatsapp_account_id'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['message_info', 'text', 'file', 'attachment_template_id'],
    },
  ],
  props: {
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'How to reach the contact.',
      required: true,
      display: 'cards',
      options: {
        options: [
          {
            label: 'Phone',
            value: 'phone_number',
            description: 'Any number',
            icon: 'user',
          },
          {
            label: 'WhatsApp ID',
            value: 'jid',
            description: 'User or group',
            icon: 'users',
          },
        ],
      },
      defaultValue: 'phone_number',
    }),
    contact: Property.DynamicProperties({
      displayName: 'Contact',
      required: true,
      refreshers: ['contactType'],
      auth: timelinesAiAuth,
      props: async ({
        contactType,
      }): Promise<DynamicPropsValue> => {
        if (contactType === 'phone_number') {
          return {
            phone: Property.ShortText({
              displayName: 'Phone Number',
              description: 'International format with country code.',
              placeholder: '+14155550123',
              required: true,
            }),
          };
        }
        if (contactType === 'jid') {
          return {
            jid: Property.ShortText({
              displayName: 'WhatsApp ID',
              description: 'WhatsApp JID of a contact or group.',
              placeholder: '123456789@s.whatsapp.net',
              required: true,
            }),
          };
        }
        return {};
      },
    }),
    whatsapp_account_id: whatsappAccountDropdown({
      required: false,
      description: 'Number to send from. Empty: your most recently connected one.',
    }),
    message_info: Property.MarkDown({
      value: 'Add a message, a file, or an attachment template.',
      variant: MarkdownVariant.INFO,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'WhatsApp formatting like *bold* works.',
      placeholder: 'Hi! Thanks for reaching out.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'Optional file to send.',
      required: false,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'Label to add to the new chat.',
      placeholder: 'Lead',
      required: false,
      advanced: true,
    }),
    chat_name: Property.ShortText({
      displayName: 'Chat Name',
      description: 'Name for the new chat in TimelinesAI.',
      required: false,
      advanced: true,
    }),
    attachment_template_id: Property.Number({
      displayName: 'Attachment Template ID',
      description: 'ID of an attachment template to send with the message.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const {
      contactType,
      contact,
      whatsapp_account_id,
      text,
      file,
      label,
      chat_name,
      attachment_template_id,
    } = propsValue;
    if (
      !isNonEmptyString(text) &&
      !file &&
      typeof attachment_template_id !== 'number'
    ) {
      throw new Error('Add a message, a file, or an attachment template.');
    }
    const fileUid = await uploadIfPresent({ apiKey, file });
    const accountPhone = await resolveAccountPhone({
      apiKey,
      accountId: whatsapp_account_id,
    });
    const messageParams = {
      text,
      label,
      chat_name,
      ...(typeof attachment_template_id === 'number'
        ? { attachment_template_id }
        : {}),
      file_uid: fileUid,
      whatsapp_account_phone: accountPhone,
    };
    if (contactType === 'phone_number') {
      const phone = readContactField({ contact, field: 'phone' });
      const response = await timelinesAiCommon.sendMessageToPhoneNumber({
        apiKey: apiKey,
        phone,
        ...messageParams,
      });
      if (response.status !== 'ok') {
        throw new Error(`Error: ${response.message || 'Failed to send message'}`);
      }
      return response;
    } else if (contactType === 'jid') {
      const jid = readContactField({ contact, field: 'jid' });
      const response = await timelinesAiCommon.sendMessageToJid({
        apiKey: apiKey,
        jid,
        ...messageParams,
      });
      if (response.status !== 'ok') {
        throw new Error(`Error: ${response.message || 'Failed to send message'}`);
      }
      return response;
    }
    return null;
  },
});

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0;
}

function readContactField({
  contact,
  field,
}: {
  contact: DynamicPropsValue;
  field: string;
}): string {
  const value: unknown = contact[field];
  if (!isNonEmptyString(value)) {
    throw new Error('Contact is required.');
  }
  return value;
}

async function uploadIfPresent({
  apiKey,
  file,
}: {
  apiKey: AuthenticationParams['apiKey'];
  file: ApFile | undefined | null;
}): Promise<string | undefined> {
  if (!file) {
    return undefined;
  }
  const fileUploadResponse = await timelinesAiCommon.uploadFile({
    apiKey,
    file: file.data,
    filename: file.filename,
  });
  if (fileUploadResponse.status !== 'ok') {
    throw new Error(
      fileUploadResponse.message
        ? `File upload failed: ${fileUploadResponse.message}`
        : 'File upload failed'
    );
  }
  return fileUploadResponse.data.uid;
}

async function resolveAccountPhone({
  apiKey,
  accountId,
}: {
  apiKey: AuthenticationParams['apiKey'];
  accountId: unknown;
}): Promise<string | undefined> {
  if (!isNonEmptyString(accountId)) {
    return undefined;
  }
  const accountsResponse = await timelinesAiCommon.listWhatsappAccounts({
    apiKey,
  });
  if (accountsResponse.status !== 'ok') {
    throw new Error(
      accountsResponse.message
        ? `Error fetching WhatsApp accounts: ${accountsResponse.message}`
        : 'Error fetching WhatsApp accounts'
    );
  }
  const account = accountsResponse.data.whatsapp_accounts.find(
    (candidate) => candidate.id === accountId
  );
  if (account === undefined) {
    throw new Error('WhatsApp account not found.');
  }
  return account.phone;
}
