import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const createLeadsListAction = createAction({
  auth: hunterAuth,
  name: 'create_leads_list',
  classification: 'WRITE',
  displayName: 'Create Leads List',
  description: 'Create a new leads list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a leads list with the given name and returns it (id, name). Each call creates a new list, even with a name that already exists, so check List Leads Lists first. Uses no credits.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Name', required: true, description: 'Name of the new leads list.' }),
  },
  outputSchema: hunterOutputSchemas.leadsList,
  async run(context) {
    return hunterRequests.createLeadsList({ apiKey: apiKeyOf(context.auth), name: context.propsValue.name });
  },
});
