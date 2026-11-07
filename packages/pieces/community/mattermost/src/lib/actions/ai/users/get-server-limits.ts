import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostGetServerLimitsOutputSchema } from '../../../output-schemas';

export const getServerLimitsAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_server_limits',
  outputSchema: mattermostGetServerLimitsOutputSchema,
  displayName: 'Get Server Limits',
  description: 'Gets the server\'s user limits and active user count.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the server\'s registered and active user counts and the user limits that apply to it. Needs a system admin connection.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/limits/server',
    });
  },
});
