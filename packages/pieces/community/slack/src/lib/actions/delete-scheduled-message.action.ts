import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackDeleteScheduledMessageAction = createAction({
  auth: slackAuth,
  name: 'slack_delete_scheduled_message',
  displayName: 'Delete Scheduled Message',
  description: 'Cancel a pending scheduled message before it is sent.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Cancel a queued (not-yet-sent) scheduled message by its channel ID and scheduled_message_id. Obtain the scheduled_message_id from Schedule Message or List Scheduled Messages. Not idempotent: re-deleting an already-cancelled or already-sent message errors.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        'Channel ID the message was scheduled to (e.g. C0123ABCD).',
      required: true,
    }),
    scheduledMessageId: Property.ShortText({
      displayName: 'Scheduled Message ID',
      description:
        'The scheduled_message_id from Schedule Message or List Scheduled Messages (e.g. Q1234ABCD).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.chat.deleteScheduledMessage({
      channel: propsValue.channel,
      scheduled_message_id: propsValue.scheduledMessageId,
    });
  },
});
