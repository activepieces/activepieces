import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_users',
  displayName: 'Get Users',
  description: 'Fetches users from clockodo',
  audience: 'both',
  aiMetadata: { description: 'List all clockodo users. Read-only, repeatable, and takes no filters. Use to discover users or resolve a user ID by name or email before another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const client = makeClient(auth.props);
    const res = await client.listUsers();
    return {
      users: res.users,
    };
  },
});
