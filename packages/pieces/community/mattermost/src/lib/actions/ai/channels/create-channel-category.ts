import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostApi } from '../../../common/api';
import { mattermostClient } from '../../../common/client';
import { mattermostCreateChannelCategoryOutputSchema } from '../../../output-schemas';

export const createChannelCategoryAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_create_channel_category',
  outputSchema: mattermostCreateChannelCategoryOutputSchema,
  displayName: 'Create Sidebar Category',
  description: 'Creates a custom sidebar category for a user in a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates a custom category in a user\'s channel sidebar for one team, optionally moving channels into it from their current categories; pass "me" for the connected account. Only that user sees it. Not idempotent: each call adds a new category.',
    idempotent: false,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
    displayName: Property.ShortText({
      displayName: 'Display Name',
      description: 'Category name shown in the sidebar.',
      required: true,
    }),
    channelIds: Property.Array({
      displayName: 'Channel IDs',
      description: 'IDs of channels the user belongs to, to move into this category. Use List User Team Channels to find them.',
      required: false,
    }),
  },
  async run(context) {
    const { userId, teamId, displayName, channelIds } = context.propsValue;
    const ownerId = userId === 'me' ? (await mattermostApi.getMe({ auth: context.auth })).id : userId;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/categories`,
      body: {
        user_id: ownerId,
        team_id: teamId,
        display_name: displayName,
        type: 'custom',
        ...(channelIds && channelIds.length > 0 ? { channel_ids: channelIds } : {}),
      },
    });
  },
});
