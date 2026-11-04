import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsGetChannelMessageByIdOutputSchema } from '../../../output-schemas';

export const getChannelMessageById = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_get_channel_message_by_id',
  outputSchema: microsoftTeamsGetChannelMessageByIdOutputSchema,
  displayName: 'Get Channel Message by ID',
  description: 'Gets one channel message, or one reply in its thread.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Gets one top-level channel message by ID, or one reply in its thread when Reply ID is set. Message IDs come from List Channel Messages and reply IDs from List Channel Message Replies; team IDs from List Joined Teams and channel IDs from List Channels.',
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
      description: 'A reply ID under that message, from List Channel Message Replies. Leave empty to get the message itself.',
      required: false,
    }),
  },
  async run(context) {
    const { teamId, channelId, messageId, replyId } = context.propsValue;
    const base = `/teams/${teamId}/channels/${channelId}/messages/${messageId}`;
    const path = replyId ? `${base}/replies/${replyId}` : base;
    const client = microsoftTeamsClient.create({ auth: context.auth });
    return await microsoftTeamsClient.withRetry(() => client.api(path).get());
  },
});
