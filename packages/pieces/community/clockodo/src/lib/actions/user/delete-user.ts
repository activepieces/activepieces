import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Deletes a user in clockodo',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a clockodo user by their numeric user ID. Destructive and not safely repeatable: a second call for the same ID fails because the user no longer exists. Confirm the correct ID before calling.', idempotent: false },
  props: {
    user_id: clockodoCommon.user_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    await client.deleteUser(propsValue.user_id as number);
  },
});
