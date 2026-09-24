import { ConversationsHistoryResponse, WebClient } from '@slack/web-api';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { singleSelectChannelInfo, slackChannel } from '../common/props';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { channelHistoryActionOutputSchema } from '../output-schemas';

export const getChannelHistory = createAction({
  name: 'getChannelHistory',
  classification: 'SEARCH',
  auth: slackAuth,
  displayName: 'Get Channel History',
  description: 'Lists messages in a channel, newest first, within a time window.',
  audience: 'human',
  aiMetadata: { description: 'Retrieve top-level messages from a known channel, paging through the full range and optionally bounded by oldest/latest timestamps; read-only and repeatable. Use this to read a channel you already have the ID for; use Search messages to find messages by content across the workspace, or Retrieve Thread Messages to read replies within a thread.', idempotent: true },
  outputSchema: channelHistoryActionOutputSchema,
  props: {
    info: singleSelectChannelInfo,
    channel: slackChannel(true),
    oldest: Property.Number({
      displayName: 'Oldest',
      description: 'Unix timestamp; only later messages are returned.',
      required: false,
    }),
    latest: Property.Number({
      displayName: 'Latest',
      description: 'Unix timestamp; only earlier messages are returned.',
      required: false,
    }),
    inclusive: Property.Checkbox({
      displayName: 'Inclusive',
      description:
        'Include messages exactly at the oldest and latest timestamps.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
    includeAllMetadata: Property.Checkbox({
      displayName: 'Include All Metadata',
      description: 'Return every metadata field Slack attaches to a message.',
      defaultValue: false,
      required: false,
      advanced: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const messages = [];
    for await (const page of client.paginate('conversations.history', {
      channel: propsValue.channel,
      oldest: propsValue.oldest,
      latest: propsValue.latest,
      limit: 200,
      include_all_metadata: propsValue.includeAllMetadata,
      inclusive: propsValue.inclusive,
    })) {
      const response = page as ConversationsHistoryResponse;
      if (response.messages) {
        messages.push(...response.messages);
      }
    }
    return messages;
  },
});
