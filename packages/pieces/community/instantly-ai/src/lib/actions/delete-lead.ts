import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';

export const deleteLeadAction = createAction({
  auth: instantlyAuth,
  name: 'delete_lead',
  displayName: 'Delete Lead',
  description: 'Deletes a lead from Instantly.',
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
