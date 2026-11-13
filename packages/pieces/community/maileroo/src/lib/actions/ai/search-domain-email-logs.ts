import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooProps } from '../../common/props';
import { mailerooSearchDomainEmailLogsOutputSchema } from '../../output-schemas';

export const mailerooSearchDomainEmailLogs = createAction({
  auth: mailerooAuth,
  name: 'maileroo_search_domain_email_logs',
  outputSchema: mailerooSearchDomainEmailLogsOutputSchema,
  displayName: 'Search Domain Email Logs',
  description: 'Searches email event logs of one domain.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Same as maileroo_search_email_logs but limited to a single domain; use it when the domain is known. Each hit carries a message ID usable with maileroo_get_email_log and maileroo_render_email_log. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    domain_id: Property.Number({ displayName: 'Domain ID', description: 'Numeric domain ID. Get it from maileroo_list_domains.', required: true }),
    ...mailerooProps.logFilters,
  },
  async run(context) {
    const { domain_id, page, ...filterValues } = context.propsValue;
    const filters = mailerooProps.buildLogFilters(filterValues);
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/domains/${encodeURIComponent(domain_id)}/logs/search`,
      body: { filters, ...spreadIfDefined('page', page) },
    });
  },
});
