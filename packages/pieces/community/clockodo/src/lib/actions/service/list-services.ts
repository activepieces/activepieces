import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_services',
  displayName: 'Get Services',
  description: 'Fetches services from clockodo',
  audience: 'both',
  aiMetadata: { description: 'List all clockodo services (billable activity types). Read-only, repeatable, and takes no filters. Use to discover available services or resolve a service ID by name before another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const client = makeClient(auth.props);
    const res = await client.listServices();
    return {
      services: res.services,
    };
  },
});
