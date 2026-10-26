import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { leadProps } from '../common/lead-props';
import { hunterOutputSchemas } from '../common/output-schemas';
import { hunterRequests } from '../common/requests';

export const upsertLeadAction = createAction({
  auth: hunterAuth,
  name: 'upsert_lead',
  classification: 'WRITE',
  displayName: 'Create or Update Lead',
  description: 'Create a lead, or update the existing lead with the same email.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a lead, or updates the existing lead that has the same email, with the fields you set (others unchanged). created tells which happened. leads_list_ids takes numeric IDs from List Leads Lists. Safe to repeat: the same input gives the same lead. Uses no credits.',
    idempotent: true,
  },
  props: {
    ...leadProps.fields({ emailRequired: true }),
    leads_list_ids: leadProps.leadsListIds(),
    custom_attributes: leadProps.customAttributes(),
  },
  outputSchema: {
    fields: [{ key: 'created', label: 'Created', format: 'boolean', description: 'True when a new lead was created, false when an existing one was updated.' }, ...hunterOutputSchemas.leadWrapped.fields],
  },
  async run(context) {
    const body = hunterRequests.buildLeadBody({ props: context.propsValue, clearFields: [], requireEmail: true });
    return hunterRequests.upsertLead({ apiKey: apiKeyOf(context.auth), body });
  },
});
