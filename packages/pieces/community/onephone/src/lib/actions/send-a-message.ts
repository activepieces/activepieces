import { createAction, Property } from '@activepieces/pieces-framework';
import { OpenPhoneAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { phoneNumberIdDropdown } from '../common/props';

export const sendAMessage = createAction({
  auth: OpenPhoneAuth,
  name: 'sendAMessage',
  displayName: 'Send a Text Message',
  description: 'Send a text message using OpenPhone',
  props: {
    to: Property.Array({
      displayName: 'To',
      description:
        'Array of phone numbers to send the message to (in E.164 format, e.g., +1234567890)',
      required: true,
    }),
    from: phoneNumberIdDropdown,
    content: Property.LongText({
      displayName: 'Message Text',
      description: 'The text content of the message (1-1600 characters)',
      required: true,
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
  async run({ auth, propsValue }) {
    const { to, from, content, userId, setInboxStatus } = propsValue;

    // Validate content length
    if (content.length < 1 || content.length > 1600) {
      throw new Error('Message content must be between 1 and 1600 characters');
    }

    // Validate that 'to' array has at least one element
    if (!to || to.length === 0) {
      throw new Error(
        'At least one phone number must be provided in the "to" field'
      );
    }

    const requestBody: any = {
      to,
      from,
      content,
    };

    if (userId) {
      requestBody.userId = userId;
    }

    if (setInboxStatus) {
      requestBody.setInboxStatus = setInboxStatus;
    }

    const response = await makeRequest(
      auth,
      HttpMethod.POST,
      '/messages',
      requestBody
    );

    return response;
  },
});
