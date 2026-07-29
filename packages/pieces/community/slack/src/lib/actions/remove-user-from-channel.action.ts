import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const removeUserFromChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_remove_user_from_channel',
  displayName: 'Remove User from Channel',
  description: 'Removes a user from a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Remove (kick) a user from a channel, the counterpart to Invite Users to Channel. Not idempotent: removing a user who is not in the channel returns a "not_in_channel" error rather than a silent no-op, so do not retry blindly. The bot must have permission to remove members.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    user: Property.ShortText({
      displayName: 'User ID',
      description:
        "Slack user ID to remove, e.g. 'U0123456789'. Resolve a handle/email to an ID first with Find User by Handle / Find User by Email.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.kick({
      channel: propsValue.channel,
      user: propsValue.user,
    });
  },
});
