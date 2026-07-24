import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const setChannelTopicAiAction = createAction({
  auth: slackAuth,
  name: 'slack_set_channel_topic',
  displayName: 'Set Channel Topic',
  description: 'Sets the topic on a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Set (overwrite) the topic shown in a channel header. Idempotent: re-running with the same topic leaves the channel in the same state. Use Set Channel Purpose for the longer "what this channel is for" description instead. The bot must be a member of the channel.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    topic: Property.LongText({
      displayName: 'Topic',
      description: 'The new topic text. Pass an empty string to clear the topic.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.setTopic({
      channel: propsValue.channel,
      topic: propsValue.topic,
    });
  },
});
