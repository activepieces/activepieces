import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelCategoryOrderOutputSchema } from '../../../output-schemas';

export const updateChannelCategoryOrderAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_channel_category_order',
  outputSchema: mattermostGetChannelCategoryOrderOutputSchema,
  displayName: 'Update Sidebar Category Order',
  description: 'Reorders a user\'s sidebar categories in a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets the top-to-bottom order of a user\'s sidebar categories in one team; pass "me" for the connected account. The list must contain every category ID from Get Sidebar Category Order, rearranged.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    order: Property.Array({
      displayName: 'Category IDs In Order',
      description: 'All of the user\'s category IDs for this team, top to bottom.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, order } = context.propsValue;
    const updated = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories/order`,
      body: order,
    });
    return { order: updated, count: updated.length };
  },
});
