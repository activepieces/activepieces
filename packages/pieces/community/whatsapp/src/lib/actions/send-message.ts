import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { whatsappAuth } from '../..';


export const sendMessage = createAction({
  auth: whatsappAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send a text message through WhatsApp',
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
  async run(context) {
    const { to, text } = context.propsValue;
    const { access_token, phoneNumberId } = context.auth;
    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://graph.facebook.com/v17.0/${phoneNumberId}/messages`,
      headers: {
        Authorization: 'Bearer ' + access_token,
      },
      body: {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to,
        type: "text",
        text: {
            body: text
        }
    }
    });
  },
});
