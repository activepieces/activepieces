import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';

export const unsetChannelMessageReaction = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_unset_channel_message_reaction',
  displayName: 'Unset Channel Message Reaction',
  description: 'Removes a reaction of the signed-in user from a channel message or reply.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Removes the signed-in user\'s reaction, given as the same unicode emoji it was set with, from a channel message, or from one reply when Reply ID is set; add one with Set Channel Message Reaction. Message IDs come from List Channel Messages and reply IDs from List Channel Message Replies.',
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
      description: 'A reply ID under that message, from List Channel Message Replies. Leave empty for the message itself.',
      required: false,
    }),
    reactionType: Property.ShortText({
      displayName: 'Reaction',
      description: 'The reaction to remove, as a unicode emoji, for example 👍.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, channelId, messageId, replyId, reactionType } = context.propsValue;
    const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
    const message = replyId ? `${base}/replies/${replyId}` : base;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    await client.api(`${message}/unsetReaction`).post({ reactionType });
    return { success: true, reactionType };
  },
});
