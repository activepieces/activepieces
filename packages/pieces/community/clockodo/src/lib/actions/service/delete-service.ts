import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient, deletedResult } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'delete_service',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Service',
  description: 'Permanently deletes a service in Clockodo. The service must be set inactive first (Update Service › Active Status = No).',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.deleted,
  aiMetadata: { description: 'Permanently delete a Clockodo service by its numeric service ID. The service must be inactive first (Update Service with Active Status = No), otherwise Clockodo refuses. Destructive and not safely repeatable: a second call for the same ID fails because the service is already gone. Confirm the correct ID before calling.', idempotent: false },
  props: {
    service_id: {
      ...clockodoCommon.service_id(true, false),
      description: 'Only inactive services can be deleted; set it inactive first (Update Service › Active Status = No).',
    },
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service' });
    await makeClient(auth.props).deleteService(id);
    return deletedResult(id);
  },
});
