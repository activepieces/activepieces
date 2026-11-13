import { createAction } from '@activepieces/pieces-framework';
import { hunterAuth } from '../auth';
import { apiKeyOf } from '../common/client';
import { hunterOutputSchemas } from '../common/output-schemas';
import { leadDeleteDropdownProp } from '../common/props';
import { hunterRequests } from '../common/requests';

export const deleteLeadAction = createAction({
  auth: hunterAuth,
  name: 'delete-lead',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead',
  description: 'Delete a specific lead record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Permanently deletes one lead picked from a dropdown. Fails with a clear message when the lead no longer exists (a second run on the same lead fails).',
    idempotent: false,
  },
  props: {
    lead_id: leadDeleteDropdownProp,
  },
  outputSchema: hunterOutputSchemas.leadDeleted,
  async run(context) {
    return hunterRequests.deleteLead({ apiKey: apiKeyOf(context.auth), leadId: context.propsValue.lead_id, missingOk: false });
  },
});
