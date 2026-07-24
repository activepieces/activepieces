import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const joinChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_join_channel',
  displayName: 'Join Channel',
  description: 'Joins an existing public channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Join an existing public channel so the bot becomes a member, which many channel and message actions require. Idempotent: joining a channel the bot is already in succeeds without changing anything. Only works for public channels; to join a private channel the bot must be invited.',
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
    return await client.conversations.join({
      channel: propsValue.channel,
    });
  },
});
