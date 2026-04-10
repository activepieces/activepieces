import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { autoAddBot, singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp, tryAddBotToChannel } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { getBotToken, getUserToken, requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const deleteMessageAction = createAction({
  name: 'delete-message',
  displayName: 'Delete Message',
  description: `Deletes a specific message from a channel using the message's timestamp.`,
  auth: slackAuth,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    autoAddBot,
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

    if (propsValue.autoAddBot) {
      await tryAddBotToChannel({
        botToken: getBotToken(auth as SlackAuthValue),
        userToken: getUserToken(auth as SlackAuthValue),
        channel: propsValue.channel,
      });
    }

    const userAccessToken = requireUserToken(auth as SlackAuthValue);
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

    return client.chat.delete({
      channel: propsValue.channel,
      ts: messageTimestamp,
    });
  },
});
