import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const getCurrentUserAction = createAction({
  auth: firefliesAiAuth,
  name: 'get_current_user',
  classification: 'READ',
  displayName: 'Get Current User',
  description: 'Gets the Fireflies user who owns the API key.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the Fireflies user who owns this connection: user ID, email, name, admin flag, transcript count and most recent meeting ID. Use its user_id to filter Find Meetings by owner. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.getCurrentUser,
  props: {},
  async run({ auth }) {
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.currentUser,
      operation: 'get the current user',
    });
    return firefliesClient.requireEntity({ data, key: 'user', notFound: 'Fireflies returned no user for this API key.' });
  },
});
