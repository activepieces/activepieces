import { clockodoOutputSchemas } from '../../common/output-schemas';
import { makeClient } from '../../common';
import { clockodoAuth } from '../../auth';
import { createAction } from '@activepieces/pieces-framework';

export default createAction({
  auth: clockodoAuth,
  name: 'list_services',
  classification: 'SEARCH',
  displayName: 'Get Services',
  description: 'Fetches services from Clockodo',
  audience: 'both',
  outputSchema: clockodoOutputSchemas.services,
  aiMetadata: { description: 'List all Clockodo services (billable activity types). Read-only, repeatable, and takes no filters. Use to discover available services or resolve a service ID by name before another call.', idempotent: true },
  props: {},
  async run({ auth }) {
    const services = await makeClient(auth.props).listServices();
    return {
      services,
    };
  },
});
