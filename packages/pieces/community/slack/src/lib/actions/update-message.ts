import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { slackAuth } from '../..';
import { blocks, slackChannel } from '../common/props';

export const updateMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateMessage',
  displayName: 'Update message',
  description: 'Update an existing message',
  auth: slackAuth,
  props: {
    channel: slackChannel,
    ts: Property.ShortText({
      displayName: 'Message ts',
      description:
        'Provide the ts (timestamp) value of the message to update, e.g. `1710304378.475129`.',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Message',
      description: 'The updated text of your message',
      required: true,
    }),
    blocks,
  },
  async run({ auth, propsValue }) {
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/chat.update',
      body: {
        channel: propsValue.channel,
        ts: propsValue.ts,
        text: propsValue.text,
        blocks: propsValue.blocks,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: auth.access_token,
      },
    };

    const response = await httpClient.sendRequest(request);

    if (!response.body.ok) {
      throw new Error(response.body.error);
    }

    return response.body;
  },
});
