import { createAction } from '@activepieces/pieces-framework';
import { gitlabAuth } from '../../auth';
import { gitlabRequest } from '../../common/client';
import { currentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: gitlabAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Gets the GitLab user the connection belongs to.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the GitLab user the connection authenticates as (ID, username, name, email, state, web URL). Use it to learn your own user ID for assignee, reviewer or author filters, or to confirm the connection works.',
    idempotent: true,
  },
  props: {},
  outputSchema: currentUserOutputSchema,
  async run({ auth }) {
    return gitlabRequest({ auth, method: 'GET', path: '/user' });
  },
});
