import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const renameChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_rename_channel',
  displayName: 'Rename Channel',
  description: 'Renames a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Rename a channel to a new name. Idempotent: re-running with the same name leaves the channel in the same final state. Slack normalizes the name (lowercased, spaces become hyphens). The bot must have permission to manage the channel.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel',
      description:
        "Channel ID (e.g. 'C0123456789'). Pass a channel ID, or resolve a #name to an ID first with Find Channel.",
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description:
        "New name for the channel, without the leading '#'. Slack lowercases it and replaces spaces with hyphens, e.g. 'project-updates'. Max 80 characters.",
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.rename({
      channel: propsValue.channel,
      name: propsValue.name,
    });
  },
});
