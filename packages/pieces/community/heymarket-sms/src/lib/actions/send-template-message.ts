import { createAction, Property } from '@activepieces/pieces-framework';
import { heymarketSmsAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const sendTemplateMessage = createAction({
  auth: heymarketSmsAuth,
  name: 'sendTemplateMessage',
  displayName: 'Send Template Message',
  description:
    'Send a message using a template to an individual contact or a list',
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
    template_id: Property.Number({
      displayName: 'Template ID',
      description: 'Unique identifier for the Heymarket template to send',
      required: true,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Phone number in E.164 format without the plus sign (e.g. 14155553434). Required if not sending to a list',
      required: false,
    }),
    targets: Property.Array({
      displayName: 'Group Targets',
      description:
        'Array of phone numbers in E.164 format without the plus sign for group MMS messages',
      required: false,
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description:
        'Optional message text body to override or supplement the template',
      required: false,
    }),
  },
  async run(context) {
    const { inbox_id, creator_id, template_id, phone_number, targets, text } =
      context.propsValue;

    // Build request body
    const body: any = {
      inbox_id,
      creator_id,
      template_id,
    };

    // Add optional fields based on which recipient type is specified
    if (phone_number) body.phone_number = phone_number;
    if (targets && targets.length > 0) body.targets = targets;

    // Add optional message fields
    if (text) body.text = text;
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
      throw new Error(`Failed to send template message: ${error.message}`);
    }
  },
});
