import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostListGroupChannelCommonTeamsOutputSchema } from '../../../output-schemas';

export const listUserTeamsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_list_user_teams',
  outputSchema: mattermostListGroupChannelCommonTeamsOutputSchema,
  displayName: 'List User Teams',
  description: 'Lists the teams a user belongs to.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Returns every team the user is a member of; pass "me" for the connected account. Another user\'s teams need a system admin connection. For the user\'s roles in each team use List User Team Memberships.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const teams = await mattermostClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/users/${encodeURIComponent(context.propsValue.userId)}/teams`,
    });
    return { teams, count: teams.length };
  },
});
