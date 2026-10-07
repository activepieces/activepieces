import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property, spreadIfDefined } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooProps } from '../../common/props';
import { mailerooSearchDomainEmailLogsOutputSchema } from '../../output-schemas';

export const mailerooSearchEmailLogs = createAction({
  auth: mailerooAuth,
  name: 'maileroo_search_email_logs',
  outputSchema: mailerooSearchDomainEmailLogsOutputSchema,
  displayName: 'Search Email Logs',
  description: 'Searches email event logs across all domains.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Searches delivery events (delivered, deferred, suppressed, bounced, complained) across every domain by message ID, reference ID, subject, sender, recipient, type or time range. Each hit carries a message ID usable with maileroo_get_email_log, maileroo_render_email_log and maileroo_resend_email. Use maileroo_search_domain_email_logs to limit to one domain. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {
    ...mailerooProps.logFilters,
  },
  async run(context) {
    const { page, ...filterValues } = context.propsValue;
    const filters = mailerooProps.buildLogFilters(filterValues);
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      path: '/logs/search',
      body: { filters, ...spreadIfDefined('page', page) },
    });
  },
});
