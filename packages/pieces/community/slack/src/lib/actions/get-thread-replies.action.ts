import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackGetThreadRepliesAiAction = createAction({
  auth: slackAuth,
  name: 'slack_get_thread_replies',
  displayName: 'Get Thread Replies',
  description: 'Retrieve all replies in a Slack thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve all replies in a thread given the channel ID and the parent message timestamp; read-only and repeatable. The timestamp must be the parent message ts, not a reply ts. Use Get Channel History for top-level channel messages, or Search Messages to find a message by content.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID containing the thread (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    threadTs: Property.ShortText({
      displayName: 'Thread Timestamp',
      description:
        'Timestamp (ts) of the parent message, e.g. 1710304378.475129. Use the parent ts, not a reply ts.',
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
