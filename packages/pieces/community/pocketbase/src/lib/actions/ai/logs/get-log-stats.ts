import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pocketbaseAuth } from '../../../auth';
import { pocketbaseAiProps } from '../../../common/ai-props';
import { pocketbaseClient } from '../../../common/client';
import { pocketbaseGetLogStatsOutputSchema } from '../../../output-schemas';

export const getLogStatsAction = createAction({
  auth: pocketbaseAuth,
  name: 'pocketbase_get_log_stats',
  outputSchema: pocketbaseGetLogStatsOutputSchema,
  displayName: 'Get Log Stats',
  description: 'Counts logs per hour.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description: 'Returns how many logs were written per hour, optionally narrowed by a filter such as "level >= 8" or "data.status >= 500". Use it to spot error spikes; use List Logs to read the entries.',
    idempotent: true,
  },
  props: {
    filter: pocketbaseAiProps.filter({ required: false }),
  },
  async run(context) {
    const { filter } = context.propsValue;
    const stats = await pocketbaseClient.request<unknown[]>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/api/logs/stats',
      query: filter ? { filter } : {},
    });
    return { stats, count: stats.length };
  },
});
