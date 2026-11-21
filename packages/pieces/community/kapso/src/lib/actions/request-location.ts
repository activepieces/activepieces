import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const requestLocation = createAction({
  auth: kapsoAuth,
  name: 'request_user_location',
  classification: 'WRITE',
  displayName: 'Request User Location',
  description: 'Send a location request message to a WhatsApp user.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends an interactive prompt asking a WhatsApp user to share their current location, with a body text explaining the request. Use to collect a location from the recipient; to share a location you already have, use Send Location instead. Each call delivers a new request message, so it is not idempotent.',
    idempotent: false,
  },
  propertyGroups: [
    {
      key: 'sender',
      display: 'section',
      label: 'Send From',
      icon: 'send',
      props: ['businessAccountId', 'phoneNumberId'],
    },
    {
      key: 'recipient',
      display: 'section',
      label: 'Send To',
      icon: 'user',
      props: ['windowInfo', 'to'],
    },
    {
      key: 'message',
      display: 'section',
      label: 'Message',
      icon: 'text',
      props: ['bodyText'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    bodyText: Property.LongText({
      displayName: 'Message',
      description: 'Shown above the Send Location button.',
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
