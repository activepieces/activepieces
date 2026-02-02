import { createAction, Property } from '@activepieces/pieces-framework';
import { smsmodeAuth } from '../common/auth';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const sendMessage = createAction({
  auth: smsmodeAuth,
  name: 'sendMessage',
  displayName: 'Send Message',
  description: 'Send an SMS message to a recipient',
  props: {
    to: Property.ShortText({
      displayName: 'Recipient Phone Number',
      description:
        'The phone number to send the message to (e.g., 33600000001)',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message Text',
      description: 'The content of the SMS message',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const body = {
      recipient: {
        to: propsValue.to,
      },
      body: {
        text: propsValue.text,
      },
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://rest.smsmode.com/sms/v1/messages',
      headers: {
        'X-Api-Key': auth.secret_text,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
});
