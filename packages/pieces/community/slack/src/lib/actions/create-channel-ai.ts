import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';
import { channelResponseOutputSchema } from '../output-schemas';

export const createChannelAiAction = createAction({
  auth: slackAuth,
  name: 'slack_create_channel',
  displayName: 'Create Channel',
  description: 'Creates a new public or private channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Create a new public or private Slack channel with the given name. Not idempotent: if a channel with that name already exists Slack returns a name-taken error rather than reusing it, so do not retry blindly. Slack normalizes names (lowercased, spaces become hyphens).',
    idempotent: false,
  },
  outputSchema: channelResponseOutputSchema,
  props: {
    channelName: Property.ShortText({
      displayName: 'Channel Name',
      description:
        "Name for the new channel, without the leading '#'. Slack lowercases it and replaces spaces with hyphens, e.g. 'project-updates'. Max 80 characters.",
      required: true,
    }),
    isPrivate: Property.Checkbox({
      displayName: 'Is Private?',
      description: 'Create the channel as private (invite-only) instead of public.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.create({
      name: propsValue.channelName,
      is_private: propsValue.isPrivate,
    });
  },
});
