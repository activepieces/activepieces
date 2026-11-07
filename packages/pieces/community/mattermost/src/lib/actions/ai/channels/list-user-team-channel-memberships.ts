import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListChannelMembersOutputSchema } from '../../../output-schemas';

export const listUserTeamChannelMembershipsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_team_channel_memberships',
  outputSchema: mattermostListChannelMembersOutputSchema,
  displayName: 'List User Channel Memberships',
  description: 'Lists a user\'s channel memberships and roles in a team.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every channel membership of a user in one team, with channel roles, unread counts and notification settings; pass "me" for the connected account. For the channels themselves use List User Team Channels.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    teamId: mattermostAiProps.teamId({ required: true }),
  },
  async run(context) {
    const { userId, teamId } = context.propsValue;
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(userId)}/teams/${encodeURIComponent(teamId)}/channels/members`,
    });
    return { members, count: members.length };
  },
});
