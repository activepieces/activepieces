import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_service',
  displayName: 'Delete Service',
  description: 'Deletes a service in clockodo',
  audience: 'both',
  aiMetadata: { description: 'Permanently delete a clockodo service by its numeric service ID. Destructive and not safely repeatable: a second call for the same ID fails because the service is already gone. Confirm the correct ID before calling.', idempotent: false },
  props: {
    service_id: clockodoCommon.service_id(true, false),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    await client.deleteService(propsValue.service_id as number);
  },
});
