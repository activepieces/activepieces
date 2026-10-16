import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { instantlyAuth } from '../auth';
import { instantlyClient } from '../common/client';
import { instantlyProps } from '../common/props';
import { InstantlyLead } from '../common/types';

export const getLeadAction = createAction({
  auth: instantlyAuth,
  name: 'get_lead',
  classification: 'READ',
  displayName: 'Get Lead',
  description: 'Gets the details of a specific lead.',
  audience: 'both',
  aiMetadata: { description: 'Retrieves the full details of a single Instantly lead by its lead ID, including contact fields, campaign and list membership, engagement counters, and custom variables. Use to read the current state of a known lead. Read-only and idempotent.', idempotent: true },
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
