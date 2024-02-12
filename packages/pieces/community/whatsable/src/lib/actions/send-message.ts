import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient, HttpMethod,
} from '@activepieces/pieces-common';
import { whatsableAuth } from '../..';

export const sendMessage = createAction({
  name: 'sendMessage',
  displayName: 'Send Message',
  description: '',
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
        'Authorization': ctx.auth,
      },
      body: {
        to,
        text,
      },
    });
  },
});
