import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskListSlaPoliciesOutputSchema } from '../../../output-schemas';

export const zendeskListSlaPolicies = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_sla_policies',
  outputSchema: zendeskListSlaPoliciesOutputSchema,
  displayName: 'List SLA Policies',
  description: 'List the SLA policies.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists SLA policies with their filters and per-priority targets. Requires an admin and the Professional plan or above.',
    idempotent: true,
  },
  props: {
  },
  async run({ auth }) {
    const response = await zendeskApi.request<{ sla_policies: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/slas/policies.json`,
    });
    return { sla_policies: response.sla_policies, count: response.sla_policies.length };
  },
});
