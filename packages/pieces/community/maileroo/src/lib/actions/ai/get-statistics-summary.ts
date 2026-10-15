import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooGetStatisticsSummaryOutputSchema } from '../../output-schemas';

export const mailerooGetStatisticsSummary = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_statistics_summary',
  outputSchema: mailerooGetStatisticsSummaryOutputSchema,
  displayName: 'Get Statistics Summary',
  description: 'Gets aggregate sending statistics for the current calendar month.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns this calendar month\'s delivered, bounced, opens, clicks and suppression totals plus per-country open and click counts for the whole account. Use maileroo_get_statistics_timeline for a day-by-day view or maileroo_get_domain_analytics for one domain. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/statistics/summary',
    });
  },
});
