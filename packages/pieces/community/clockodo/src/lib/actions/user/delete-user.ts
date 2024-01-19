import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_user',
  displayName: 'Delete User',
  description: 'Deletes a user in clockodo',
  props: {
    user_id: clockodoCommon.user_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    await client.deleteUser(propsValue.user_id as number);
  },
});
