import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListUserTeamMembershipsOutputSchema } from '../../../output-schemas';

export const listUserTeamMembershipsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_team_memberships',
  outputSchema: mattermostListUserTeamMembershipsOutputSchema,
  displayName: 'List User Team Memberships',
  description: 'Lists a user\'s membership and roles in each of their teams.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns the user\'s team memberships (team ID, roles, admin flag) across all their teams; pass "me" for the connected account. For the teams themselves use List User Teams.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const memberships = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/teams/members`,
    });
    return { memberships, count: memberships.length };
  },
});
