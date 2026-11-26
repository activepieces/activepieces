import { createAction } from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from '../../common/auth';
import { capsuleCrmClient } from '../../common/client';
import { usersOutputSchema } from '../../common/output-schemas';

export const aiListUsers = createAction({
  auth: capsuleCrmAuth,
  name: 'ai_list_users',
  classification: 'READ',
  displayName: 'List Users',
  description: 'Lists users of the Capsule account.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists the users of the Capsule CRM account with their numeric IDs. Use an id as Owner User ID in other tools. Read-only.',
    idempotent: true,
  },
  outputSchema: usersOutputSchema,
  props: {

  },
  async run({ auth }) {
    return { users: await capsuleCrmClient.listUsers({ auth }) };
  },
});
