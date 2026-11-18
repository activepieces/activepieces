import { createAction, Property } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChannelMessageRepliesOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const listChannelMessageReplies = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_channel_message_replies',
  outputSchema: microsoftTeamsListChannelMessageRepliesOutputSchema,
  displayName: 'List Channel Message Replies',
  description: 'Lists the replies in the thread of a channel message, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the replies in the thread of one top-level channel message, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Message IDs come from List Channel Messages; team IDs from List Joined Teams and channel IDs from List Channels.',
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
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { teamId, channelId, messageId, limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      nextLink,
    });
  },
});
