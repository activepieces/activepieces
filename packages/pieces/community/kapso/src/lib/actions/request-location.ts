import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import { phoneNumberIdDropdown } from '../common/props';

export const requestLocation = createAction({
  auth: kapsoAuth,
  name: 'request_user_location',
  displayName: 'Request User Location',
  description: 'Send a location request message to a WhatsApp user.',
  props: {
    phoneNumberId: phoneNumberIdDropdown,
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The recipient\'s phone number in international format (e.g. 15551234567).',
      required: true,
    }),
    bodyText: Property.LongText({
      displayName: 'Body Text',
      description: 'The message body displayed with the location request.',
      required: true,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, bodyText } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendInteractiveLocationRequest({
      phoneNumberId,
      to,
      bodyText,
      parameters: {
        requestMessage: bodyText,
      },
    });

    return response;
  },
});
