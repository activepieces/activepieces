import { clockodoRequests } from '../../common/requests';
import { clockodoOutputSchemas } from '../../common/output-schemas';
import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_service',
  classification: 'READ',
  displayName: 'Get Service',
  description: 'Retrieves a single service from Clockodo',
  audience: 'human',
  outputSchema: clockodoOutputSchemas.service,
  aiMetadata: { description: 'Fetch one Clockodo service (a billable activity type) by its numeric service ID. Read-only and repeatable. Use when you already hold the service ID; to browse or resolve a service by name use Get Services instead.', idempotent: true },
  props: {
    service_id: clockodoCommon.service_id(true, null),
  },
  async run({ auth, propsValue }) {
    const id = clockodoRequests.parseId({ value: propsValue.service_id, field: 'Service' });
    return makeClient(auth.props).getService(id);
  },
});
