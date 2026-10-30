import { createAction } from '@activepieces/pieces-framework';

import { microsoftTeamsAuth } from '../../../auth';
import { microsoftTeamsAiProps } from '../../../common/ai-props';
import { microsoftTeamsClient } from '../../../common/client';
import { microsoftTeamsListChannelMessagesOutputSchema } from '../../../output-schemas';

const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;

export const listChannelMessages = createAction({
  auth: microsoftTeamsAuth,
  name: 'microsoft_teams_list_channel_messages',
  outputSchema: microsoftTeamsListChannelMessagesOutputSchema,
  displayName: 'List Channel Messages',
  description: 'Lists the top-level messages in a channel, one page at a time.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the top-level messages of one channel, newest first, without their replies, one page at a time; pass @odata.nextLink back as Next Page Link for the next page. Team IDs come from List Joined Teams and channel IDs from List Channels; use List Channel Message Replies for a thread.',
    idempotent: true,
  },
  props: {
    teamId: microsoftTeamsAiProps.teamId({ required: true }),
    channelId: microsoftTeamsAiProps.channelId({ required: true }),
    limit: microsoftTeamsAiProps.limit({ max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT }),
    nextLink: microsoftTeamsAiProps.nextLink(),
  },
  async run(context) {
    const { teamId, channelId, limit, nextLink } = context.propsValue;
    return await microsoftTeamsClient.list({
      auth: context.auth,
      path: `/teams/${teamId}/channels/${channelId}/messages`,
      page: { limit, max: MAX_LIMIT, defaultValue: DEFAULT_LIMIT },
      nextLink,
    });
  },
});
