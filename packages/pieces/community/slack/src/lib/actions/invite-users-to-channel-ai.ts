import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const inviteUsersToChannelAiAction = createAction({
  auth: slackAuth,
  name: 'slack_invite_users_to_channel',
  displayName: 'Invite Users to Channel',
  description: 'Invites one or more existing users to a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Add one or more existing workspace users to an existing channel as members. Not idempotent: Slack returns an error if a user is already in the channel (the end state is the same, but a retry is not silent). Use Remove User from Channel to reverse. The bot must be a member of the channel.',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description:
        "Slack user IDs to invite, e.g. 'U0123456789'. Resolve handles/emails to IDs first with Find User by Handle / Find User by Email. Up to 1000 users per call.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    const users = (propsValue.userIds as string[]).join(',');
    return await client.conversations.invite({
      channel: propsValue.channel,
      users,
    });
  },
});
