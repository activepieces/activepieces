import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const slackDeleteMessageAiAction = createAction({
  auth: slackAuth,
  name: 'slack_delete_message',
  displayName: 'Delete Message',
  description: 'Delete a message from a Slack channel by its timestamp.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently delete one message from a channel, identified by channel ID and the message timestamp (ts). Obtain the ts from Post Message, Search Messages, or Get Channel History. To revise the content instead of removing it, use Update Message. Requires a user token with rights to remove the message; not idempotent (re-deleting an already-gone message errors).',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID containing the message (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp (ts) of the message to delete, e.g. 1710304378.475129. Obtain it from Post Message / Search Messages / Get Channel History.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const messageTimestamp = processMessageTimestamp(propsValue.ts);
    if (!messageTimestamp) {
      throw new Error('Invalid Timestamp Value.');
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
