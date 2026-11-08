import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../../auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { hunterOutputSchemas } from '../../common/output-schemas';
import { hunterRequests } from '../../common/requests';

export const getLeadByIdAction = createAction({
  auth: hunterAuth,
  name: 'get_lead_by_id',
  classification: 'READ',
  displayName: 'Get Lead by ID',
  description: 'Get one lead by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Gets the full record of one lead (contact, company, verification, list, custom attributes) by numeric lead ID from Search Leads or Create Lead. Fails with "not found" for an unknown ID. Uses no credits. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    lead_id: aiProps.leadId(),
  },
  outputSchema: hunterOutputSchemas.leadWrapped,
  async run(context) {
    const lead = await hunterRequests.getLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id });
    return { lead };
  },
});
