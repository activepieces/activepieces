import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAddTeamMembersOutputSchema } from '../../../output-schemas';

export const getTeamMembersByIdsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_members_by_ids',
  outputSchema: mattermostAddTeamMembersOutputSchema,
  displayName: 'Get Team Members By IDs',
  description: 'Gets the team memberships of several users at once.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the memberships in one team for the given user IDs; users who are not members are left out. For a single user use Get Team Member.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (26 characters each). Use Get User By Username or Search Users to find them.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, userIds } = context.propsValue;
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/members/ids`,
      body: userIds,
    });
    return { members, count: members.length };
  },
});
