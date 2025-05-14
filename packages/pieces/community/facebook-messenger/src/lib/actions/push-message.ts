import { Property, createAction } from '@activepieces/pieces-framework';
import {
  HttpMethod,
  httpClient,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { facebookAuth } from '../auth/facebook-auth';

export const pushMessage = createAction({
  name: 'push_message',
  auth: facebookAuth,
  displayName: 'Push Message',
  description: 'Send a message back to the user via Facebook Messenger',
  props: {
    senderId: Property.ShortText({
      displayName: 'Sender PSID',
      description: 'The PSID of the user to send the message to(Sender ID)',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Message Text',
      description: 'The text of the message to send',
      required: true,
    }),
  },
  async run(context) {
    const requestBody = {
      recipient: {
        id: context.propsValue.senderId,
      },
      message: {
        text: context.propsValue.text,
      },
    };

    return httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://graph.facebook.com/v19.0/me/messages',
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: requestBody,
    });
  },
});
