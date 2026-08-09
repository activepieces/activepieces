import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const leaveChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_leave_channel',
  displayName: 'Leave Channel',
  description: 'Leaves a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Leave a channel so the bot is no longer a member, the counterpart to Join Channel. Idempotent: leaving a channel the bot is not in succeeds without changing anything. After leaving, the bot can no longer read or post in the channel until it rejoins.',
    idempotent: true,
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
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    try {
      return await client.conversations.leave({
        channel: propsValue.channel,
      });
    } catch (e) {
      // Leaving is idempotent: if the bot is already not a member Slack returns
      // a `not_in_channel` error rather than a silent no-op. The desired end
      // state (bot not in the channel) already holds, so treat it as success.
      const slackError = (e as { data?: { error?: string } })?.data?.error;
      if (slackError === 'not_in_channel') {
        return { ok: true, already_left: true };
      }
      throw e;
    }
  },
});
