import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { requireUserToken, SlackAuthValue } from '../common/auth-helpers';

export const unarchiveChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_unarchive_channel',
  displayName: 'Unarchive Channel',
  description: 'Reopens an archived channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reopen an archived channel, the counterpart to Archive Channel. Not idempotent: unarchiving a channel that is not archived returns a "not_archived" error rather than a silent no-op, so do not retry blindly. Uses the authorizing user\'s token (Slack only allows a member/admin to unarchive, not a bot token).',
    idempotent: false,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(requireUserToken(auth as SlackAuthValue));
    return await client.conversations.unarchive({
      channel: propsValue.channel,
    });
  },
});
