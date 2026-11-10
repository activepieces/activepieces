import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelsByIdsOutputSchema } from '../../../output-schemas';

export const searchChannelsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_search_channels',
  outputSchema: mattermostGetChannelsByIdsOutputSchema,
  displayName: 'Search Channels',
  description: 'Searches a team\'s public channels by name.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Finds a team\'s public channels whose name or display name matches the term; users without permission to list the team\'s channels only get channels they belong to. Across all teams use Search All Channels; for an exact handle use Get Channel By Name.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    term: Property.ShortText({
      displayName: 'Term',
      description: 'Text to match against the channel name and display name.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, term } = context.propsValue;
    const channels = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/channels/search`,
      body: { term },
    });
    return { channels, count: channels.length };
  },
});
