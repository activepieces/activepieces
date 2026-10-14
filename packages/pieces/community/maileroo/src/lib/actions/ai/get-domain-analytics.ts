import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooGetDomainAnalyticsOutputSchema } from '../../output-schemas';

export const mailerooGetDomainAnalytics = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_domain_analytics',
  outputSchema: mailerooGetDomainAnalyticsOutputSchema,
  displayName: 'Get Domain Analytics',
  description: 'Gets totals, a daily timeline and top providers for a domain.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns aggregate delivered, bounced, opens, clicks and suppressions for one domain, a daily timeline and the top receiving providers. Get the domain_id from maileroo_list_domains. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({
      displayName: 'Domain ID',
      description: 'Numeric domain ID. Get it from maileroo_list_domains.',
      required: true,
    }),
  },
  async run(context) {
    const { domain_id } = context.propsValue;
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/domains/${encodeURIComponent(domain_id)}/analytics`,
    });
  },
});
