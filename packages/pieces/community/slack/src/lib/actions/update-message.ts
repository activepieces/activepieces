import { createAction, Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { slackAuth } from '../..';
import { blocks, slackChannel, slackInfo } from '../common/props';
import { processMessageTimestamp } from '../common/utils';

export const updateMessage = createAction({
  // auth: check https://www.activepieces.com/docs/developers/piece-reference/authentication,
  name: 'updateMessage',
  displayName: 'Update message',
  description: 'Update an existing message',
  auth: slackAuth,
  props: {
    info: slackInfo,
    channel: slackChannel,
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Please provide the timestamp of the message you wish to update, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
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
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: 'https://slack.com/api/chat.update',
      body: {
        channel: propsValue.channel,
        ts: messageTimestamp,
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
