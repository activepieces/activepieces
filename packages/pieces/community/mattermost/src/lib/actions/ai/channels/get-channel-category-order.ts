import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostGetChannelCategoryOrderOutputSchema } from '../../../output-schemas';

export const getChannelCategoryOrderAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_channel_category_order',
  outputSchema: mattermostGetChannelCategoryOrderOutputSchema,
  displayName: 'Get Sidebar Category Order',
  description: 'Gets the order of a user\'s sidebar categories in a team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the IDs of a user\'s sidebar categories in one team, top to bottom; pass "me" for the connected account. Change it with Update Sidebar Category Order.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    const order = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories/order`,
    });
    return { order, count: order.length };
  },
});
