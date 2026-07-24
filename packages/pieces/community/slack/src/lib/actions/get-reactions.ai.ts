import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { ReactionsGetArguments, WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import { getBotToken, SlackAuthValue } from '../common/auth-helpers';

export const slackGetReactions = createAction({
  auth: slackAuth,
  name: 'slack_get_reactions',
  displayName: 'Get Reactions',
  description: 'Get the reactions on a message or file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Fetches all emoji reactions on a single message (by channel and message timestamp) or file (by file ID). Use this to inspect who reacted with what to one specific item; use List User Reactions to enumerate everything a user reacted to. Pass a channel ID, or resolve a #name first with Find Channel; obtain the message timestamp from a posted message, search, or channel history. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    channel: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Channel ID of the message (e.g. C0123ABCD). Required when targeting a message; leave empty when targeting a file.',
      required: false,
    }),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp of the message, e.g. 1710304378.475129. Required (with Channel ID) when targeting a message.',
      required: false,
    }),
    file: Property.ShortText({
      displayName: 'File ID',
      description:
        'File ID to get reactions for (e.g. F0123ABCD). Provide this instead of Channel ID + Timestamp when targeting a file.',
      required: false,
    }),
    full: Property.Checkbox({
      displayName: 'Full reaction list?',
      description: 'If enabled, returns the complete list of reactions (not truncated).',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { channel, ts, file, full } = context.propsValue;

    const token = getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);

    let args: ReactionsGetArguments;
    if (file) {
      args = { file, full };
    } else if (channel && ts) {
      const timestamp = processMessageTimestamp(ts);
      if (!timestamp) {
        throw new Error('Invalid Timestamp Value.');
      }
      args = { channel, timestamp, full };
    } else {
      throw new Error(
        'Provide either a File ID, or both a Channel ID and a Message Timestamp.'
      );
    }

    return await client.reactions.get(args);
  },
});
