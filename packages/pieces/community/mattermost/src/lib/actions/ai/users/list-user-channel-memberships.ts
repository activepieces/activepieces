import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostListUserChannelMembershipsOutputSchema } from '../../../output-schemas';

export const listUserChannelMembershipsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_channel_memberships',
  outputSchema: mattermostListUserChannelMembershipsOutputSchema,
  displayName: 'List User Channel Memberships',
  description: 'Lists a user\'s channel memberships across all teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns one page of a user\'s channel memberships across every team, with their channel roles, unread and mention counts and notification settings; pass "me" for the connected account. Another user needs permission to edit other users. For the channels themselves use List User Channels.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    page: mattermostAiProps.page({ required: false }),
    perPage: mattermostAiProps.perPage({ required: false }),
  },
  async run(context) {
    const { userId, page, perPage } = context.propsValue;
    const channelMembers = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/channel_members`,
      query: mattermostUtils.paging({ page, perPage }),
    });
    return { channelMembers, count: channelMembers.length };
  },
});
