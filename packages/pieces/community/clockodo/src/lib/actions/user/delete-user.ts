import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_user',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete User',
  description: 'Permanently deletes a user in Clockodo. The user must be set inactive first (Update User › Active Status = No).',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: { description: 'Permanently delete a Clockodo user by their numeric user ID. The user must be inactive first (Update User with Active Status = No), otherwise Clockodo refuses. Destructive and not safely repeatable: a second call for the same ID fails because the user no longer exists. Confirm the correct ID before calling.', idempotent: false },
  props: {
    user_id: {
      ...clockodoCommon.user_id(true, false),
      description: 'Only inactive users can be deleted; set it inactive first (Update User › Active Status = No).',
    },
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.user_id, field: 'User' });
    await makeClient(auth.props).deleteUser(id);
    return deletedResult(id);
  },
});
