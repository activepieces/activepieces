import { createAction, MarkdownVariant, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../auth';
import { openPhoneCommon, OpenPhoneMessageResponse } from '../common';

export const sendMessage = createAction({
  auth: openPhoneAuth,
  name: 'send_message',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send SMS/MMS from your OpenPhone number to a recipient',
  audience: 'both',
  aiMetadata: { description: 'Sends an SMS/MMS text message from one of the workspace\'s OpenPhone numbers to a recipient. Choose this to programmatically text a contact or phone number. Requires the sending OpenPhone number (E.164 like +15555555555 or a phone-number ID) and exactly one recipient number in E.164 format; content must be 1-1600 characters. Not idempotent — each call sends a new message.', idempotent: false },
  propertyGroups: [
    {
      key: 'destination',
      display: 'section',
      label: 'Send To',
      icon: 'send',
      props: ['from', 'to', 'recipientNote'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['content'],
    },
  ],
  props: {
    from: Property.ShortText({
      displayName: 'From',
      description: 'Your OpenPhone number with country code, or its ID (PN…).',
      placeholder: '+15555555555',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To',
      required: true,
      properties: {
        phoneNumber: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Start with + and the country code, no spaces.',
          placeholder: '+15555555555',
          required: true,
        }),
      },
    }),
    recipientNote: Property.MarkDown({
      value: 'Sends to one recipient. Adding more than one fails the step.',
      variant: MarkdownVariant.INFO,
    }),
    content: Property.LongText({
      displayName: 'Message',
      description: 'Plain text, up to 1,600 characters.',
      required: true,
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description: "OpenPhone user to send as. Empty: the number's owner.",
      placeholder: 'US123abc',
      required: false,
      advanced: true,
    }),
    setInboxStatus: Property.StaticDropdown({
      displayName: 'Inbox Status',
      description: 'Choose Done to mark the conversation done after sending.',
      required: false,
      advanced: true,
      options: {
        options: [
          {
            label: 'Done',
            value: 'done',
          },
        ],
      },
    }),
  },
  async run(context) {
    const { content, from, to, userId, setInboxStatus } = context.propsValue;
    const auth = context.auth;

    const phoneRegex = /^\+[1-9]\d{1,14}$/;
    if (!to || !Array.isArray(to) || to.length === 0) {
      throw new Error('At least one phone number is required');
    }
    if (to.length > 1) {
      throw new Error('Currently only one recipient phone number is supported');
    }

    const toPhoneNumbers = to as Array<{ phoneNumber: string }>;
    for (const phone of toPhoneNumbers) {
      if (!phoneRegex.test(phone.phoneNumber)) {
        throw new Error(
          `Invalid phone number format: ${phone.phoneNumber}. Use E.164 format (e.g., +15555555555)`
        );
      }
    }

    if (!content || !content.trim()) {
      throw new Error(
        'Message content cannot be empty or contain only whitespace'
      );
    }
    if (content.length > 1600) {
      throw new Error('Message content cannot exceed 1600 characters');
    }

    const requestBody: any = {
      content: content,
      from: from,
      to: toPhoneNumbers.map((phone) => phone.phoneNumber),
    };

    if (userId) {
      requestBody.userId = userId;
    }

    if (setInboxStatus) {
      requestBody.setInboxStatus = setInboxStatus;
    }

    try {
      const response: OpenPhoneMessageResponse =
        await openPhoneCommon.makeRequest<OpenPhoneMessageResponse>(
          HttpMethod.POST,
          '/v1/messages',
          auth,
          requestBody
        );

      return response;
    } catch (error) {
      throw new Error(`Failed to send message: ${error}`);
    }
  },
});
