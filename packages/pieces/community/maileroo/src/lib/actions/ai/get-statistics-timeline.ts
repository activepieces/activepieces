import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { mailerooAuth } from '../../auth';
import { mailerooClient } from '../../common/client';
import { mailerooGetStatisticsTimelineOutputSchema } from '../../output-schemas';

export const mailerooGetStatisticsTimeline = createAction({
  auth: mailerooAuth,
  name: 'maileroo_get_statistics_timeline',
  outputSchema: mailerooGetStatisticsTimelineOutputSchema,
  displayName: 'Get Statistics Timeline',
  description: 'Gets daily sending statistics for the last month.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns one entry per day for the last month with delivered, bounced, opens, clicks and suppressions plus per-country open and click data. Use maileroo_get_statistics_summary for monthly totals only. Requires an Account Key connection.',
    idempotent: true,
  },
  props: {},
  async run(context) {
    return await mailerooClient.accountRequest({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/statistics/timeline',
    });
  },
});
