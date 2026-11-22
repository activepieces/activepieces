import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_user',
  classification: 'READ',
  displayName: 'Get User',
  description: 'Retrieves a single user from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.user,
  aiMetadata: { description: 'Fetch one Clockodo user by their numeric user ID. Read-only and repeatable. Use when you already hold the user ID; to find a user by name or email or list many use Get Users instead.', idempotent: true },
  props: {
    user_id: clockodoCommon.user_id(true, null),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User' });
    return makeClient(auth.props).getUser(id);
  },
});
