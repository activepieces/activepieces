import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { openPhoneAuth } from '../../index';
import { openPhoneCommon, OpenPhoneMessageResponse } from '../common';

export const sendMessage = createAction({
  auth: openPhoneAuth,
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Send SMS/MMS from your OpenPhone number to a recipient',
  props: {
    content: Property.LongText({
      displayName: 'Message Content',
      description:
        'The text content of the message to be sent (1-1600 characters)',
      required: true,
    }),
    from: Property.ShortText({
      displayName: 'From Phone Number',
      description:
        'OpenPhone number to send from (E.164 format: +15555555555) or phone number ID (PN123abc)',
      required: true,
    }),
    to: Property.Array({
      displayName: 'To Phone Numbers',
      description:
        'Recipient phone numbers in E.164 format (e.g., +15555555555)',
      required: true,
      properties: {
        phoneNumber: Property.ShortText({
          displayName: 'Phone Number',
          description: 'Phone number in E.164 format',
          required: true,
        }),
      },
    }),
    userId: Property.ShortText({
      displayName: 'User ID',
      description:
        'The unique identifier of the OpenPhone user sending the message. If not provided, defaults to the phone number owner.',
      required: false,
    }),
    setInboxStatus: Property.StaticDropdown({
      displayName: 'Inbox Status',
      description: 'Set the status of the related OpenPhone inbox conversation',
      required: false,
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
