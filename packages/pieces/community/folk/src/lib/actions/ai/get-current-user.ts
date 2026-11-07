import { createAction } from '@activepieces/pieces-framework';
import { folkAuth } from '../../common/auth';
import { folkClient } from '../../common/client';
import { folkOutputSchemas } from '../../output-schemas';

export const getCurrentUser = createAction({
  auth: folkAuth,
  name: 'get_current_user',
  displayName: 'Get Current User',
  description: 'Get the Folk user who owns the API key.',
  audience: 'ai',
  classification: 'READ',
  outputSchema: folkOutputSchemas.user,
  aiMetadata: {
    description: 'Returns the Folk user behind the connection (id usr_..., full name, email), e.g. to assign tasks to yourself. Read-only.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return folkClient.getData<Record<string, unknown>>({ auth: context.auth, path: '/v1/users/me' });
  },
});
