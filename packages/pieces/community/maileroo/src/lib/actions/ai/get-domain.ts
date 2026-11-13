import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooDomainOutputSchema } from '../../output-schemas';

export const mailerooGetDomain = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_domain',
  outputSchema: mailerooDomainOutputSchema,
  displayName: 'Get Domain',
  description: 'Gets a domain with its DNS records, settings and statistics.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one domain with the DKIM, SPF, DMARC, MX and tracking DNS records to configure, verification status, tracking settings and sending statistics. Get the domain_id from maileroo_list_domains. Requires an Account Key connection.',
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
      path: `/domains/${encodeURIComponent(domain_id)}`,
    });
  },
});
