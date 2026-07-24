import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackGetMessagePermalinkAction = createAction({
  auth: slackAuth,
  name: 'slack_get_message_permalink',
  displayName: 'Get Message Permalink',
  description: 'Get a shareable permalink URL for a specific message.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Return a stable, shareable permalink URL for one message identified by channel ID and message timestamp (ts); read-only and repeatable. Obtain the ts from Post Message, Search Messages, or Get Channel History. Use this when you need a link to reference a message elsewhere.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID containing the message (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    messageTs: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp (ts) of the message, e.g. 1710304378.475129. Obtain it from Post Message / Search Messages / Get Channel History.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const messageTimestamp = processMessageTimestamp(propsValue.messageTs);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
    }
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.chat.getPermalink({
      channel: propsValue.channel,
      message_ts: messageTimestamp,
    });
  },
});
