import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { autoAddBot, slackChannel } from '../common/props';
import { processMessageTimestamp, tryAddBotToChannel } from '../common/utils';
import { getBotToken, getUserToken, SlackAuthValue } from '../common/auth-helpers';

export const retrieveThreadMessages = createAction({
  name: 'retrieveThreadMessages',
  displayName: 'Retrieve Thread Messages',
  description: 'Retrieves thread messages by channel and thread timestamp.',
  auth: slackAuth,
  props: {
    channel: slackChannel(true),
    autoAddBot,
    threadTs: Property.ShortText({
      displayName: 'Thread ts',
      description:
        'Provide the ts (timestamp) value of the **parent** message to retrieve replies of this message. Do not use the ts value of the reply itself; use its parent instead. For example `1710304378.475129`.Alternatively, you can easily obtain the message link by clicking on the three dots next to the parent message and selecting the `Copy link` option.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const messageTimestamp = processMessageTimestamp(propsValue.threadTs);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }

    const botToken = getBotToken(auth as SlackAuthValue);

    if (propsValue.autoAddBot) {
      await tryAddBotToChannel({
        botToken,
        userToken: getUserToken(auth as SlackAuthValue),
        channel: propsValue.channel,
      });
    }

    const client = new WebClient(botToken);
    return await client.conversations.replies({
      channel: propsValue.channel,
      ts: messageTimestamp,
    });
  },
});
