import { createAction, Property } from '@activepieces/pieces-framework';
import { slackAuth } from '../auth';
import { ReactionsRemoveArguments, WebClient } from '@slack/web-api';
import { processMessageTimestamp } from '../common/utils';
import {
  getBotToken,
  requireUserToken,
  SlackAuthValue,
} from '../common/auth-helpers';

export const slackRemoveReaction = createAction({
  auth: slackAuth,
  name: 'slack_remove_reaction',
  displayName: 'Remove Reaction',
  description: 'Remove an emoji reaction from a message or file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes an emoji reaction from a message (by channel and message timestamp) or from a file (by file ID). This is the inverse of Add Reaction. Pass a channel ID, or resolve a #name first with Find Channel; obtain the message timestamp from a posted message, search, or channel history. Provide the emoji name without colons, e.g. thumbsup. Not idempotent: removing an absent reaction fails with a no_reaction error rather than succeeding as a no-op (the end state is the same, but a retry surfaces an error).',
    idempotent: false,
  },
  props: {
    reaction: Property.ShortText({
      displayName: 'Reaction (emoji) name',
      description: 'The emoji name without colons, e.g. thumbsup.',
      required: true,
    }),
    channel: Property.ShortText({
      displayName: 'Channel ID',
      description:
        'Channel ID of the message to remove the reaction from (e.g. C0123ABCD). Required when targeting a message; leave empty when targeting a file.',
      required: false,
    }),
    ts: Property.ShortText({
      displayName: 'Message Timestamp',
      description:
        'Timestamp of the message to remove the reaction from, e.g. 1710304378.475129. Required (with Channel ID) when targeting a message.',
      required: false,
    }),
    file: Property.ShortText({
      displayName: 'File ID',
      description:
        'File ID to remove the reaction from (e.g. F0123ABCD). Provide this instead of Channel ID + Timestamp when targeting a file.',
      required: false,
    }),
    reactAsUser: Property.Checkbox({
      displayName: 'React as user?',
      description:
        'If enabled, the reaction is removed as the authenticated user instead of the bot.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { reaction, channel, ts, file, reactAsUser } = context.propsValue;

    const token = reactAsUser
      ? requireUserToken(context.auth as SlackAuthValue)
      : getBotToken(context.auth as SlackAuthValue);
    const client = new WebClient(token);

    let args: ReactionsRemoveArguments;
    if (file) {
      args = { name: reaction, file };
    } else if (channel && ts) {
      const timestamp = processMessageTimestamp(ts);
      if (!timestamp) {
        throw new Error('Invalid Timestamp Value.');
      }
      args = { name: reaction, channel, timestamp };
    } else {
      throw new Error(
        'Provide either a File ID, or both a Channel ID and a Message Timestamp.'
      );
    }

    return await client.reactions.remove(args);
  },
});
