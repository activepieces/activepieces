import { createAction, Property } from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendCustomMessage = createAction({
  auth: heymarketSmsAuth,
  name: 'sendCustomMessage',
  displayName: 'Send Custom Message',
  description: 'Send a custom text message to an individual contact or a list',
  props: {
    inbox_id: Property.Number({
      displayName: 'Inbox ID',
      description:
        'Unique identifier for the inbox from which the message will be sent',
      required: true,
    }),
    creator_id: Property.Number({
      displayName: 'Creator ID',
      description:
        'Unique identifier for the sender (member ID from Get Inboxes)',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'Custom message text body',
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in E.164 format without the plus sign (e.g. 14155553434). Required if not sending to a list or chat',
      required: false,
    }),

    targets: Property.Array({
      displayName: 'Group Targets',
      description:
        'Array of phone numbers in E.164 format without the plus sign for group MMS messages',
      required: false,
    }),
  },
  async run(context) {
    const {
      inbox_id,
      creator_id,
      text,
      phone_number,

      targets,
    } = context.propsValue;

    // Build request body
    const body: any = {
      inbox_id,
      creator_id,
      text,
    };

    // Add optional fields based on which recipient type is specified
    if (phone_number) body.phone_number = phone_number;
    if (targets && targets.length > 0) body.targets = targets;

    const apiKey = context.auth.secret_text;

    try {
      const response = await makeRequest(
        apiKey,
        HttpMethod.POST,
        '/v1/message/send',
        body
      );

      return response;
    } catch (error: any) {
      throw new Error(`Failed to send custom message: ${error.message}`);
    }
  },
});
