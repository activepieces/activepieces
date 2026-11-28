import { createAction } from '@activepieces/pieces-framework';
import { firefliesAiAuth } from '../../auth';
import { firefliesClient } from '../../common/client';
import { firefliesQueries } from '../../common/queries';
import { firefliesOutputSchemas } from '../../output-schemas';

export const listUsersAction = createAction({
  auth: firefliesAiAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'List Users',
  description: 'Lists the users on the Fireflies team.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every user on the API key owner\'s Fireflies team with user ID, email, name and admin flag. Use it to find a user_id for Find Meetings or Get User Details. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: firefliesOutputSchemas.listUsers,
  props: {},
  async run({ auth }) {
    const data = await firefliesClient.graphql({
      apiKey: auth,
      query: firefliesQueries.listUsers,
      operation: 'list users',
    });
    const users = firefliesClient.recordList(data['users']);
    return { users, count: users.length };
  },
});
