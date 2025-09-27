import {
  createAction,
  DynamicPropsValue,
  Property,
} from '@activepieces/pieces-framework';
import { timelinesAiAuth, timelinesAiCommon } from '../common';
import { whatsappAccountDropdown } from '../common/properties';

export const sendMessageToNewChat = createAction({
  auth: timelinesAiAuth,
  name: 'sendMessageToNewChat',
  displayName: 'Send Message to New Chat',
  description:
    'Create a new chat (new conversation) by specifying the WhatsApp account, phone number, and message.',
  props: {
    contactType: Property.StaticDropdown({
      displayName: 'Contact Type',
      description: 'Select the type of contact identifier',
      required: true,
      options: {
        options: [
          { label: 'Phone Number', value: 'phone_number' },
          { label: 'JID', value: 'jid' },
        ],
      },
      defaultValue: 'phone_number',
    }),
    contact: Property.DynamicProperties({
      displayName: 'Contact',
      description:
        'Select the contact identifier based on the chosen contact type',
      required: true,
      refreshers: ['contactType'],
      props: async ({
        contactType,
      }: {
        contactType?: string;
      }): Promise<DynamicPropsValue> => {
        if (contactType === 'phone_number') {
          return {
            phone: Property.ShortText({
              displayName: 'Phone Number',
              description:
                'A phone number formatted to the international standard: [+][country code][area code][local phone number].',
              required: true,
            }),
          };
        }
        if (contactType === 'jid') {
          return {
            jid: Property.ShortText({
              displayName: 'JID',
              description:
                "WhatsApp ID (JID) of a contact or group, e.g. '123456789@s.whatsapp.net'.",
              required: true,
            }),
          };
        }
        return {};
      },
    }),
    whatsapp_account_id: whatsappAccountDropdown({ required: false }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The text message to be sent in the chat.',
      required: false,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to be sent in the chat.',
      required: false,
    }),
    label: Property.ShortText({
      displayName: 'Label',
      description: 'An optional label to categorize the chat.',
      required: false,
    }),
    chat_name: Property.ShortText({
      displayName: 'Chat Name',
      description: 'An optional name for the chat (useful for group chats).',
      required: false,
    }),
    attachment_template_id: Property.Number({
      displayName: 'Attachment Template ID',
      description:
        'Optional ID of a predefined attachment template to use when sending files.',
      required: false,
    }),
  },
  async run({ auth: apiKey, propsValue }) {
    const { contactType, contact, ...rest } = propsValue;
    if (contactType === 'phone_number') {
      const response = await timelinesAiCommon.sendMessageToPhoneNumber({
        apiKey: apiKey,
        phone: (contact as { phone: string }).phone,
        ...rest,
      });
      if (response.status !== 'ok') {
        throw new Error(`Error: ${response.message || 'Failed to send message'}`);
      }
      return response;
    } else if (contactType === 'jid') {
      const response = await timelinesAiCommon.sendMessageToJid({
        apiKey: apiKey,
        jid: (contact as { jid: string }).jid,
        ...rest,
      });
      if (response.status !== 'ok') {
        throw new Error(`Error: ${response.message || 'Failed to send message'}`);
      }
      return response;
    }
    return null;
  },
});
