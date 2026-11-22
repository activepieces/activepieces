import { clockodoOutputSchemas } from '../../common/output-schemas';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_users',
  classification: 'SEARCH',
  displayName: 'Get Users',
  description: 'Fetches users from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.users,
  aiMetadata: { description: 'List all Clockodo users. Read-only, repeatable, and takes no filters. Use to discover users or resolve a user ID by name or email before another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const users = await makeClient(auth.props).listUsers();
    return {
      users,
    };
  },
});
