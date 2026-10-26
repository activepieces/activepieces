import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../../auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { leadProps } from '../../common/lead-props';
import { hunterOutputSchemas } from '../../common/output-schemas';
import { clearFieldsProp } from '../../common/props';
import { hunterRequests } from '../../common/requests';

export const updateLeadByIdAction = createAction({
  auth: hunterAuth,
  name: 'update_lead_by_id',
  classification: 'WRITE',
  displayName: 'Update Lead by ID',
  description: 'Update one lead by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Updates one lead by numeric lead ID (from Search Leads): sets the fields you give, blanks the ones listed in clear_fields, leaves the rest unchanged, and returns the updated lead. leads_list_ids takes numeric IDs from List Leads Lists. Re-sending the same values gives the same result. Uses no credits.',
    idempotent: true,
  },
  props: {
    lead_id: aiProps.leadId(),
    ...leadProps.fields({ emailRequired: false }),
    leads_list_ids: leadProps.leadsListIds(),
    custom_attributes: leadProps.customAttributes(),
    clear_fields: clearFieldsProp,
  },
  outputSchema: hunterOutputSchemas.leadUpdated,
  async run(context) {
    const body = hunterRequests.buildLeadBody({ props: context.propsValue, clearFields: context.propsValue.clear_fields, requireEmail: false });
    return hunterRequests.updateLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id, body });
  },
});
