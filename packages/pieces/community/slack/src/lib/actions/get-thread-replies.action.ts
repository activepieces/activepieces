import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { threadCursor } from '../common/props';
import { fetchAllThreadReplies, processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { threadRepliesActionOutputSchema } from '../output-schemas';

export const slackGetThreadRepliesAiAction = createAction({
  auth: slackAuth,
  name: 'slack_get_thread_replies',
  classification: 'SEARCH',
  displayName: 'Get Thread Replies',
  description: 'Retrieve the replies in a Slack thread.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve the replies in a thread given the channel ID and the parent message timestamp; read-only and repeatable. Returns up to 10,000 replies per call; when has_more is true, pass response_metadata.next_cursor as the cursor to continue. The timestamp must be the parent message ts, not a reply ts. Use Get Channel History for top-level channel messages, or Search Messages to find a message by content.',
    idempotent: true,
  },
  outputSchema: threadRepliesActionOutputSchema,
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
    cursor: threadCursor,
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const messageTimestamp = processMessageTimestamp(propsValue.threadTs);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }
    return await fetchAllThreadReplies({ client, channel: propsValue.channel, ts: messageTimestamp, cursor: propsValue.cursor });
  },
});
