import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const retrieveThreadMessages = createAction({
  name: 'retrieveThreadMessages',
  displayName: 'Retrieve Thread Messages',
  description: 'Retrieves thread messages by channel and thread timestamp.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve all replies in a thread given the channel and the parent message timestamp; read-only and repeatable. The timestamp must be that of the parent message, not a reply. Use this to read a conversation thread; use Get channel history for top-level channel messages.', idempotent: true },
  auth: slackAuth,
  props: {
    channel: slackChannel(true),
    threadTs: Property.ShortText({
      displayName: 'Thread ts',
      description:
        'Provide the ts (timestamp) value of the **parent** message to retrieve replies of this message. Do not use the ts value of the reply itself; use its parent instead. For example `1710304378.475129`.Alternatively, you can easily obtain the message link by clicking on the three dots next to the parent message and selecting the `Copy link` option.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
      const messageTimestamp = processMessageTimestamp(propsValue.threadTs);
        if (!messageTimestamp) {
          throw new Error('Invalid Timestamp Value.');
        }
    return await client.conversations.replies({
      channel: propsValue.channel,
      ts: messageTimestamp,
    });
  },
});
