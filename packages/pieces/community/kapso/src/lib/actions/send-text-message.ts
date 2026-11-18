import { createAction, Property } from '@activepieces/pieces-framework';
import { kapsoAuth } from '../common';
import { makeClient } from '../common';
import {
  businessAccountIdProp,
  freeFormWindowInfo,
  phoneNumberIdDropdown,
  recipientPhoneProp,
} from '../common/props';

export const sendTextMessage = createAction({
  auth: kapsoAuth,
  name: 'send_text_message',
  classification: 'WRITE',
  displayName: 'Send Text Message',
  description: 'Send a text message via WhatsApp.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a plain text WhatsApp message to a recipient phone number from a connected WhatsApp Business number. Use for free-form text replies; choose Send Template Message instead when initiating a conversation outside the 24-hour customer service window. Requires the recipient number in international format. Each call delivers a new message, so it is not idempotent.',
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
      props: ['body'],
    },
  ],
  props: {
    businessAccountId: businessAccountIdProp,
    phoneNumberId: phoneNumberIdDropdown,
    windowInfo: freeFormWindowInfo,
    to: recipientPhoneProp,
    body: Property.LongText({
      displayName: 'Message',
      description: 'Up to 4,096 characters. WhatsApp formatting such as *bold* works.',
      required: true,
    }),
    previewUrl: Property.Checkbox({
      displayName: 'Link Preview',
      description: 'Show a preview of the first link in the message.',
      required: false,
      defaultValue: false,
      advanced: true,
    }),
  },
  async run(context) {
    const { phoneNumberId, to, body, previewUrl } = context.propsValue;
    const client = makeClient(context.auth.secret_text);

    const response = await client.messages.sendText({
      phoneNumberId,
      to,
      body,
      previewUrl: previewUrl ?? undefined,
    });

    return response;
  },
});
