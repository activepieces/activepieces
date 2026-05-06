import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const getLeadAction = createAction({
  auth: instantlyAuth,
  name: 'get_lead',
  displayName: 'Get Lead',
  description: 'Gets the details of a specific lead.',
  props: {
    lead_id: instantlyProps.leadId(true),
  },
  async run(context) {
    return instantlyClient.makeRequest<InstantlyLead>({
      auth: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `leads/${context.propsValue.lead_id}`,
    });
  },
});
