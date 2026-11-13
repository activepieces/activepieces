import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAddTeamMemberOutputSchema } from '../../../output-schemas';

export const addTeamMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_add_team_member',
  outputSchema: mattermostAddTeamMemberOutputSchema,
  displayName: 'Add Team Member',
  description: 'Adds a user to a team.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds one user to a team, or joins an open team as the connected user. Adding someone who is already a member keeps the existing membership. For several users at once use Add Team Members.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userId: mattermostAiProps.userId({
      required: true,
      description: 'User ID (26 characters); "me" is not accepted here. Use Get User By Username or Search Users to find it.',
    }),
  },
  async run(context) {
    const { teamId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/teams/${encodeURIComponent(teamId)}/members`,
      body: { team_id: teamId, user_id: userId },
    });
  },
});
