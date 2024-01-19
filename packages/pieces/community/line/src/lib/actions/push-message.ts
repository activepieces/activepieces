import { Property, createAction } from '@activepieces/pieces-framework';
import { lineAuth2 } from '../..';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const pushMessage = createAction({
  name: 'push_message', // Must be a unique across the piece, this shouldn't be changed.
  auth: lineAuth2,
  displayName: 'Push Message',
  description: 'Push message to the line account',
  props: {
    userId: Property.ShortText({
      displayName: 'User Id',
      description: 'The user id can be obtained from the webhook payload',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      required: true,
    }),
  },
  async run(context) {
    return httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.line.me/v2/bot/message/push`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      body: {
        to: context.propsValue.userId,
        messages: [
          {
            type: 'text',
            text: context.propsValue.text,
          },
        ],
      },
    });
  },
});
