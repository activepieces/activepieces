import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../..';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { WebClient } from '@slack/web-api';

export const deleteMessageAction = createAction({
  name: 'delete-message',
  displayName: 'Delete Message',
  description: `Deletes a specific message from a channel using the message's timestamp.`,
  auth: slackAuth,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Please provide the timestamp of the message you wish to retrieve, such as `1710304378.475129`. Alternatively, you can easily obtain the message link by clicking on the three dots next to the message and selecting the `Copy link` option.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }

        const userAccessToken = auth.data?.authed_user?.access_token;

    const client = new WebClient(userAccessToken);

    const historyResponse = await client.conversations.history({
      channel: propsValue.channel,
      oldest: messageTimestamp,
      limit: 1,
      inclusive: true,
    });

    const message = historyResponse.messages?.[0];

    if (!message) {
      throw new Error('No message found for the provided timestamp.');
    }


    if (!userAccessToken) {
      throw new Error('User access token is missing.');
    }

    // const userClient = new WebClient(userAccessToken);

    return client.chat.delete({
      channel: propsValue.channel,
      ts: messageTimestamp,
    });
  },
});
