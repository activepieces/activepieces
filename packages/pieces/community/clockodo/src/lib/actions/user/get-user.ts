import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../../';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_user',
  displayName: 'Get User',
  description: 'Retrieves a single user from clockodo',
  props: {
    user_id: clockodoCommon.user_id(true, null),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth);
    const res = await client.getUser(propsValue.user_id as number);
    return res.user;
  },
});
