import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieves a single user from clockodo',
  audience: 'both',
  aiMetadata: { description: 'Fetch one clockodo user by their numeric user ID. Read-only and repeatable. Use when you already hold the user ID; to find a user by name or email or list many use Get Users instead.', idempotent: true },
  props: {
    user_id: clockodoCommon.user_id(true, null),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getUser(propsValue.user_id as number);
    return res.user;
  },
});
