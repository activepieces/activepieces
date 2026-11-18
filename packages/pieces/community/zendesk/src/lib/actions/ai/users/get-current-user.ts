import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskGetCurrentUserOutputSchema } from '../../../output-schemas';

export const zendeskGetCurrentUser = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_current_user',
  outputSchema: zendeskGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Get the user the connection is authenticated as.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the user behind this connection, with role and permissions. Use it to learn the connected agent ID, e.g. to assign tickets to yourself or check admin access.',
    idempotent: true,
  },
  props: {
  },
  async run({ auth }) {
    const response = await zendeskApi.request<{ user: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/users/me.json`,
    });
    return response.user;
  },
});
