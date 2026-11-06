import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../../auth';
import { aiProps } from '../../common/ai-props';
import { apiKeyOf } from '../../common/client';
import { hunterOutputSchemas } from '../../common/output-schemas';
import { hunterRequests } from '../../common/requests';

export const deleteLeadByIdAction = createAction({
  auth: hunterAuth,
  name: 'delete_lead_by_id',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead by ID',
  description: 'Permanently delete one lead by its numeric ID.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one lead by numeric lead ID (from Search Leads). Returns deleted=true when it was removed and deleted=false when the lead did not exist (already deleted), so a repeat call is safe. Cannot be undone.',
    idempotent: true,
  },
  props: {
    lead_id: aiProps.leadId(),
  },
  outputSchema: hunterOutputSchemas.leadDeleted,
  async run(context) {
    return hunterRequests.deleteLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id, missingOk: true });
  },
});
