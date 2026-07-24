import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackListScheduledMessagesAction = createAction({
  auth: slackAuth,
  name: 'slack_list_scheduled_messages',
  displayName: 'List Scheduled Messages',
  description: 'List pending scheduled messages.',
  audience: 'ai',
  aiMetadata: {
    description:
      'List messages that have been scheduled but not yet sent, optionally filtered by channel and a time window; read-only and repeatable. Use this to obtain a scheduled_message_id before cancelling one with Delete Scheduled Message.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Optional channel ID to filter by (e.g. C0123ABCD). Leave blank for all channels.',
      required: false,
    }),
    oldest: Property.Number({
      displayName: 'Oldest',
      description: 'Only scheduled messages after this Unix timestamp.',
      required: false,
    }),
    latest: Property.Number({
      displayName: 'Latest',
      description: 'Only scheduled messages before this Unix timestamp.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const scheduledMessages = [];
    for await (const page of client.paginate('chat.scheduledMessages.list', {
      channel: propsValue.channel || undefined,
      oldest: propsValue.oldest,
      latest: propsValue.latest,
      limit: 100,
    })) {
      const response = page as {
        scheduled_messages?: unknown[];
      };
      if (response.scheduled_messages) {
        scheduledMessages.push(...response.scheduled_messages);
      }
    }
    return scheduledMessages;
  },
});
