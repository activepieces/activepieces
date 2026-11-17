import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const deleteSequenceLead = createAction({
  auth: villageAuth,
  name: 'delete_sequence_lead',
  classification: 'DESTRUCTIVE',
  displayName: 'Remove Lead from Sequence',
  description: 'Remove a lead from its sequence so no more emails are sent to them. Free.',
  audience: 'both',
  aiMetadata: {
    description: 'Removes one lead (lead ID from List Sequence Leads, not the person ID) from its sequence. Repeating the call on a removed lead succeeds again.',
    idempotent: true,
  },
  outputSchema: villageSchemas.deleteSequenceLead,
  props: {
    lead_id: Property.ShortText({ displayName: 'Lead ID', required: true }),
  },
  async run(context) {
    const leadId = villageApi.requireText({ value: context.propsValue.lead_id, field: 'Lead ID' });
    await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/v2/sequences/leads/${villageApi.encodePathId(leadId)}`,
    });
    return { success: true, lead_id: leadId };
  },
});
