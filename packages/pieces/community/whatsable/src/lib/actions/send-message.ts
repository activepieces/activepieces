import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient, HttpMethod,
} from '@activepieces/pieces-common';
import { whatsableAuth } from '../..';

export const sendMessage = createAction({
  name: 'sendMessage',
  classification: 'WRITE',
  displayName: 'Send Message',
  description: 'Send a WhatsApp text message to a phone number.',
  audience: 'both',
  aiMetadata: { description: 'Sends a WhatsApp text message to a single recipient through a connected Whatsable (WhatsApp Business) account. Use to deliver a one-off outbound message; requires the recipient phone number and the message text. Not idempotent: each call sends a new message, so repeating it delivers duplicates.', idempotent: false },
  auth: whatsableAuth,
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'Phone number with country code, starting with +.',
      placeholder: '+15558675310',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'Delivers only if the recipient messaged you in the last 24 hours.',
      placeholder: 'Hi Sam, your order has shipped.',
      required: true,
    }),
  },
  async run(ctx) {
    const { to, text } = ctx.propsValue;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://dashboard.whatsable.app/api/whatsapp/messages/send',
      headers: {
        'Authorization': ctx.auth.secret_text,
      },
      body: {
        to,
        text,
      },
    });
  },
});
