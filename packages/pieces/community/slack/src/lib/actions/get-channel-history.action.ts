import { ConversationsHistoryResponse, WebClient } from '@slack/web-api';
import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackGetChannelHistoryAiAction = createAction({
  auth: slackAuth,
  name: 'slack_get_channel_history',
  displayName: 'Get Channel History',
  description:
    'Retrieve top-level messages from a Slack channel, optionally bounded by timestamps.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Retrieve top-level (non-thread) messages from a channel you already have the ID for, paging through the full range and optionally bounded by oldest/latest timestamps; read-only and repeatable. Pass a channel ID (e.g. C0123ABCD); resolve a #name with Find Channel. Use Search Messages to find messages by content across the workspace, or Get Thread Replies to read replies within a thread.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID to read (e.g. C0123ABCD). Resolve a #name with Find Channel.',
      required: true,
    }),
    oldest: Property.Number({
      displayName: 'Oldest',
      description: 'Only messages after this Unix timestamp are included.',
      required: false,
    }),
    latest: Property.Number({
      displayName: 'Latest',
      description:
        'Only messages before this Unix timestamp are included. Defaults to now.',
      required: false,
    }),
    inclusive: Property.Checkbox({
      displayName: 'Inclusive',
      description:
        'Include messages with the oldest/latest timestamps. Ignored unless a timestamp is set.',
      required: false,
      defaultValue: false,
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
