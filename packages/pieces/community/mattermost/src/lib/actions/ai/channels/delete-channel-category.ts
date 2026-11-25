import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const deleteChannelCategoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_delete_channel_category',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Delete Sidebar Category',
  description: 'Deletes a custom sidebar category of a user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Deletes a custom sidebar category of a user in a team; its channels move back to the default Channels category and no channel is affected. Only custom categories can be deleted; pass "me" for the connected account.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    categoryId: Property.ShortText({
      displayName: 'Category ID',
      description: 'ID of a custom sidebar category. Use List Sidebar Categories to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, teamId, categoryId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories/${encodeURIComponent(categoryId)}`,
    });
  },
});
