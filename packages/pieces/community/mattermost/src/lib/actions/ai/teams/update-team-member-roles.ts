import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostUtils } from '../../../common/utils';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const updateTeamMemberRolesAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_update_team_member_roles',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Update Team Member Roles',
  description: 'Makes a team member a team admin or a regular member.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Sets whether a team member is a team admin and whether they are a regular team user; pass "me" for the connected account. Usually Team Admin "true" plus Team User "true" for an admin, Team Admin "false" plus Team User "true" for a regular member. Needs the manage_team_roles permission.',
    idempotent: true,
  },
  props: {
    teamId: mattermostAiProps.teamId({ required: true }),
    userId: mattermostAiProps.userId({ required: true }),
    schemeAdmin: mattermostAiProps.booleanFlag({
      required: true,
      displayName: 'Team Admin',
      description: '"true" to make the member a team admin, "false" to remove admin rights.',
    }),
    schemeUser: mattermostAiProps.booleanFlag({
      required: true,
      displayName: 'Team User',
      description: '"true" for a regular team member. Keep "true" unless the member is a guest.',
    }),
  },
  async run(context) {
    const { teamId, userId, schemeAdmin, schemeUser } = context.propsValue;
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.PUT,
      path: `/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}/schemeRoles`,
      body: {
        scheme_admin: mattermostUtils.parseBoolean({ value: schemeAdmin }),
        scheme_user: mattermostUtils.parseBoolean({ value: schemeUser }),
      },
    });
  },
});
