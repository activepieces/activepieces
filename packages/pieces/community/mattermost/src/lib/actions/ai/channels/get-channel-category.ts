import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelCategoryOutputSchema } from '../../../output-schemas';

export const getChannelCategoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_category',
  outputSchema: mattermostCreateChannelCategoryOutputSchema,
  displayName: 'Get Sidebar Category',
  description: 'Gets one of a user\'s sidebar categories.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns one sidebar category of a user in a team, with its name, type, sorting and ordered channel IDs; pass "me" for the connected account.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'Sidebar category ID. Use List Sidebar Categories to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, categoryId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories/${encodeURIComponent(categoryId)}`,
    });
  },
});
