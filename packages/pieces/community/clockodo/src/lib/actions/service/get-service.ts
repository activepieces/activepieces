import { clockodoCommon, makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'get_service',
  displayName: 'Get Service',
  description: 'Retrieves a single service from clockodo',
  audience: 'both',
  aiMetadata: { description: 'Fetch one clockodo service (a billable activity type) by its numeric service ID. Read-only and repeatable. Use when you already hold the service ID; to browse or resolve a service by name use Get Services instead.', idempotent: true },
  props: {
    service_id: clockodoCommon.service_id(true, null),
  },
  async run({ auth, propsValue }) {
    const client = makeClient(auth.props);
    const res = await client.getService(propsValue.service_id as number);
    return res.service;
  },
});
