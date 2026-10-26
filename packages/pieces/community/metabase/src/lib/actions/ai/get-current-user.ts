import { createAction } from '@activepieces/pieces-framework';
import { metabaseApi } from '../../api';
import { metabaseAuth } from '../../auth';
import { metabaseGetCurrentUserOutputSchema } from '../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: metabaseAuth,
  name: 'metabase_get_current_user',
  outputSchema: metabaseGetCurrentUserOutputSchema,
  displayName: 'Get Current User',
  description: 'Get the user behind the connection.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns the Metabase user the API key acts as, including id, email, admin status and group memberships.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    return await metabaseApi.getCurrentUser({ auth });
  },
});
