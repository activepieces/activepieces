import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient, HttpMethod,
} from '@activepieces/pieces-common';
import { whatsableAuth } from '../..';

export const sendMessage = createAction({
  name: 'sendMessage',
  displayName: 'Send Message',
  description: '',
  audience: 'both',
  aiMetadata: { description: 'Sends a WhatsApp text message to a single recipient through a connected Whatsable (WhatsApp Business) account. Use to deliver a one-off outbound message; requires the recipient phone number and the message text. Not idempotent: each call sends a new message, so repeating it delivers duplicates.', idempotent: false },
  auth: whatsableAuth,
  props: {
    to: Property.ShortText({
      displayName: 'To',
      description: 'The recipient of the message',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The message to send',
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
