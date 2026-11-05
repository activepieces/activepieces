import { createAction, Property } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { aiProps } from '../common/ai-props';
import { apiKeyOf, optionalInteger } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const getLeadsListAction = createAction({
  auth: hunterAuth,
  name: 'get_leads_list',
  classification: 'READ',
  displayName: 'Get Leads List',
  description: 'Get a leads list and its leads by list ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Gets one leads list by numeric ID (from List Leads Lists) with its name, leads_count and a page of its leads (limit 1-1000, default 20, offset). Uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    leads_list_id: aiProps.leadsListId(),
    limit: Property.Number({ displayName: 'Leads Limit', required: false, description: 'Leads to return (1-1000, default 20).' }),
    offset: Property.Number({ displayName: 'Leads Offset', required: false, description: 'Leads to skip (default 0).' }),
  },
  outputSchema: hunterOutputSchemas.leadsList,
  async run(context) {
    return hunterRequests.getLeadsList({
      apiKey: apiKeyOf(context.auth),
      leadsListId: context.propsValue.leads_list_id,
      limit: optionalInteger({ value: context.propsValue.limit, label: 'Leads Limit', min: 1, max: 1000 }),
      offset: optionalInteger({ value: context.propsValue.offset, label: 'Leads Offset', min: 0, max: 100000 }),
    });
  },
});
