import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { processMessageTimestamp } from '../common/utils';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const deleteMessageAction = createAction({
  name: 'delete-message',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Message',
  description: 'Deletes a message. Needs a user token.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently delete one Slack message from a channel, identified by its timestamp (ts) and channel. Pick this to remove a previously posted message; to instead edit its content use Update Message. Not idempotent in effect though re-deleting an already-gone message errors, and deletion requires a user token with rights to remove that message.',
    idempotent: false,
  },
  auth: slackAuth,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp of the target message, from its link or a trigger output.',
      placeholder: '1710304378.475129',
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
