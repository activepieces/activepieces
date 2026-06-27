import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const getChannelInfoAction = createAction({
  auth: slackAuth,
  name: 'slack_get_channel_info',
  displayName: 'Get Channel Info',
  description: 'Gets details about a single channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Get the full detail of one channel by its ID — topic, purpose, privacy, archived state, creator and optionally the member count. Use this when you already have a channel ID and need its metadata; use Find Channel to resolve a name to an ID first, or List Channel Members to get the member list. Read-only and repeatable.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    includeNumMembers: Property.Checkbox({
      displayName: 'Include Member Count',
      description: 'Include the number of members in the channel in the result.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.info({
      channel: propsValue.channel,
      include_num_members: propsValue.includeNumMembers ?? false,
    });
  },
});
