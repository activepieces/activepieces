import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAddTeamMembersOutputSchema } from '../../../output-schemas';

export const addTeamMembersAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_add_team_members',
  outputSchema: mattermostAddTeamMembersOutputSchema,
  displayName: 'Add Team Members',
  description: 'Adds several users to a team at once.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a list of users to a team in one call and stops at the first user that cannot be added. Needs the add_user_to_team permission. For one user use Add Team Member.',
    idempotent: false,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userIds: Property.Array({
      displayName: 'User IDs',
      description: 'User IDs (26 characters each) to add. Use Get User By Username or Search Users to find them.',
      required: true,
    }),
  },
  async run(context) {
    const { teamId, userIds } = context.propsValue;
    const members = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/members/batch`,
      body: userIds.map((userId) => ({ team_id: teamId, user_id: userId })),
    });
    return { members, count: members.length };
  },
});
