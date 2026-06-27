import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackMarkConversationReadAction = createAction({
  auth: slackAuth,
  name: 'slack_mark_conversation_read',
  displayName: 'Mark Conversation Read',
  description: 'Move the read cursor in a channel up to a given message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set the read cursor in a channel so messages up to and including a given timestamp (ts) are marked read, identified by channel ID. Obtain the ts from Get Channel History or Post Message. Setting the same cursor again leaves the same state, so it is idempotent.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID to mark read (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    ts: Property.ShortText({
      displayName: 'Timestamp',
      description:
        'Mark the channel read up to this message ts, e.g. 1710304378.475129.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.mark({
      channel: propsValue.channel,
      ts: messageTimestamp,
    });
  },
});
