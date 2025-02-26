import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { devinAuth } from '../..';

export const sendMessage = createAction({
  name: 'send_message',
  displayName: 'Send Message',
  description: 'Sends a message to a Devin session',
  auth: devinAuth,
  props: {
    sessionId: Property.ShortText({
      displayName: 'Session ID',
      required: true,
      description: 'The ID of the session to send the message to',
    }),
    message: Property.LongText({
      displayName: 'Message',
      required: true,
      description: 'The message to send to the session',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.devin.ai/v1/session/${propsValue.sessionId}/messages`,
      headers: {
        Authorization: `Bearer ${auth}`,
      },
      body: {
        message: propsValue.message,
      },
    });
    return response.body;
  },
});
