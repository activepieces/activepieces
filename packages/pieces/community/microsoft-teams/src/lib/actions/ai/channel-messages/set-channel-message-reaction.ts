import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsSetChannelMessageReactionOutputSchema } from '../../../output-schemas';

export const setChannelMessageReaction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_set_channel_message_reaction',
  outputSchema: microsoftTeamsSetChannelMessageReactionOutputSchema,
  displayName: 'Set Channel Message Reaction',
  description: 'Adds a reaction from the signed-in user to a channel message or reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds the signed-in user\'s reaction, given as a unicode emoji, to a channel message, or to one reply when Reply ID is set; remove it with Unset Channel Message Reaction. Message IDs come from List Channel Messages and reply IDs from List Channel Message Replies.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
    messageId: Property.ShortText({
      displayName: 'Message ID',
      description: 'The top-level message ID, from List Channel Messages.',
      required: true,
    }),
    replyId: Property.ShortText({
      displayName: 'Reply ID',
      description: 'A reply ID under that message, from List Channel Message Replies. Leave empty to react to the message itself.',
      required: false,
    }),
    reactionType: Property.ShortText({
      displayName: 'Reaction',
      description: 'The reaction as a unicode emoji, for example 👍 or ❤️.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelId, messageId, replyId, reactionType } = context.propsValue;
    const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
    const message = replyId ? `${base}/replies/${replyId}` : base;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`${message}/setReaction`).post({ reactionType });
    return { success: true, reactionType };
  },
});
