import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListChannelCategoriesOutputSchema } from '../../../output-schemas';

export const listChannelCategoriesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_channel_categories',
  outputSchema: mattermostListChannelCategoriesOutputSchema,
  displayName: 'List Sidebar Categories',
  description: 'Lists a user\'s sidebar categories in a team, with their channels.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns a user\'s sidebar categories in one team (Favorites, Channels, Direct Messages and custom ones), each with its channel IDs in display order, plus the category order; pass "me" for the connected account. These are personal sidebar groupings, not team settings.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories`,
    });
  },
});
