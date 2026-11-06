import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeOutputSchemas } from '../../common/output-schemas';

const deleteLead = createAction({
  auth: closeAuth,
  name: 'delete_lead',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead',
  description: 'Permanently delete a lead with its contacts, opportunities, tasks and activities.',
  audience: 'ai',
  aiMetadata: {
    description: 'Permanently deletes a Close lead by lead id (lead_...), together with all its contacts, opportunities, tasks and activities. This cannot be undone. Repeating it on an already-deleted lead returns not found.',
    idempotent: false,
  },
  outputSchema: closeOutputSchemas.deleted,
  props: {
    leadId: Property.ShortText({ displayName: 'Lead ID', description: 'lead_...', required: true }),
  },
  async run({ auth, propsValue }) {
    const leadId = closeClient.closeId({ value: propsValue.leadId, label: 'Lead ID', prefix: 'lead' });
    await closeClient.request({ auth, method: HttpMethod.DELETE, path: `/lead/${closeClient.pathId(leadId)}/` });
    return { deleted: true, id: leadId };
  },
});

export { deleteLead };
