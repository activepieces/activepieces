import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';

export const deleteLeadAction = createAction({
  auth: instantlyAuth,
  name: 'delete_lead',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Lead',
  description: 'Deletes a lead from Instantly.',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes an Instantly lead by its lead ID and returns a success flag. Use to remove a contact from the workspace; this cannot be undone, so confirm the lead ID first. Not safe to retry — a second call on the same ID fails because the lead no longer exists.', idempotent: false },
  props: {
    lead_id: instantlyProps.leadId(true),
  },
  async run(context) {
    await instantlyClient.makeRequest({
      auth: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `leads/${context.propsValue.lead_id}`,
    });

    return { success: true };
  },
});
