import { slackAuth } from '../auth';
import { createAction, Property } from '@activepieces/pieces-framework';
import { WebClient } from '@slack/web-api';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const archiveChannelAction = createAction({
  auth: slackAuth,
  name: 'slack_archive_channel',
  displayName: 'Archive Channel',
  description: 'Archives a channel.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Archive a channel, closing it to new activity while preserving its history. Not idempotent: archiving an already-archived channel returns an "already_archived" error rather than a silent no-op, so do not retry blindly. Use Unarchive Channel to reverse this. The bot must be a member with permission to archive.',
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
    const client = new WebClient(getBotToken(auth as SlackAuthValue));
    return await client.conversations.archive({
      channel: propsValue.channel,
    });
  },
});
