import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const setChannelPurposeAction = createAction({
  auth: slackAuth,
  name: 'slack_set_channel_purpose',
  displayName: 'Set Channel Purpose',
  description: 'Sets the purpose on a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set (overwrite) the purpose of a channel, the longer "what this channel is for" description. Idempotent: re-running with the same purpose leaves the channel in the same state. Use Set Channel Topic for the short topic shown in the channel header instead. The bot must be a member of the channel.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    purpose: Property.LongText({
      displayName: 'Purpose',
      description: 'The new purpose text. Pass an empty string to clear the purpose.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.setPurpose({
      channel: propsValue.channel,
      purpose: propsValue.purpose,
    });
  },
});
