import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf, optionalInteger } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const listLeadsListsAction = createAction({
  auth: hunterAuth,
  name: 'list_leads_lists',
  classification: 'READ',
  displayName: 'List Leads Lists',
  description: 'List the leads lists in your Hunter account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists leads lists (id, name, leads_count, created_at) with limit (1-100, default 20) and offset paging; total is the number of lists in the account. Use the id with Get Leads List or in leads_list_ids of Create Lead. Uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({ displayName: 'Limit', required: false, description: 'Lists to return (1-100, default 20).' }),
    offset: Property.Number({ displayName: 'Offset', required: false, description: 'Lists to skip (default 0).' }),
  },
  outputSchema: hunterOutputSchemas.leadsListList,
  async run(context) {
    return hunterRequests.listLeadsLists({
      apiKey: apiKeyOf(context.auth),
      limit: optionalInteger({ value: context.propsValue.limit, label: 'Limit', min: 1, max: 100 }),
      offset: optionalInteger({ value: context.propsValue.offset, label: 'Offset', min: 0, max: 100000 }),
    });
  },
});
