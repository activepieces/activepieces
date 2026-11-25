import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostAddTeamMemberOutputSchema } from '../../../output-schemas';

export const getTeamMemberAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_team_member',
  outputSchema: mattermostAddTeamMemberOutputSchema,
  displayName: 'Get Team Member',
  description: 'Gets one user\'s membership in a team.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a user\'s membership in a team (roles, admin flag); pass "me" for the connected account. Fails if the user was never a member; a removed member is still returned, with delete_at set to the removal time.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { teamId, userId } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}`,
    });
  },
});
