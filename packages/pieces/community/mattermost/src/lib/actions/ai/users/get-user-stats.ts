import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetFilteredUserStatsOutputSchema } from '../../../output-schemas';

export const getUserStatsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_stats',
  outputSchema: mattermostGetFilteredUserStatsOutputSchema,
  displayName: 'Get User Count',
  description: 'Gets the total number of users on the server.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the total number of users on the server. To count only users in a team or channel or with given roles, or to choose whether bots and deactivated users count, use Get Filtered User Count.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/users/stats',
    });
  },
});
