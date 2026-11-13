import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { leadSelectDropdownProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const getLeadAction = createAction({
  auth: hunterAuth,
  name: 'get-lead',
  classification: 'READ',
  displayName: 'Get Lead',
  description: 'Retrieve details of a specific lead.',
  audience: 'human',
  aiMetadata: {
    description: 'Gets the full record of one lead picked from a dropdown (contact, company, verification, list). Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lead_id: leadSelectDropdownProp,
  },
  outputSchema: hunterOutputSchemas.leadWrapped,
  async run(context) {
    const lead = await hunterRequests.getLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id });
    return { lead };
  },
});
