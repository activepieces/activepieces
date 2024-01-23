import { makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_users',
  displayName: 'Get Users',
  description: 'Fetches users from clockodo',
  props: {},
  async run({ auth }) {
    const client = makeClient(auth);
    const res = await client.listUsers();
    return {
      users: res.users,
    };
  },
});
