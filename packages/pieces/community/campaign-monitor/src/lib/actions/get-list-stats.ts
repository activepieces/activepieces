import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { campaignMonitorAuth } from '../auth';
import { clientId, listId } from '../common/props';
import { listStatsOutputSchema } from '../output-schemas';

export const getListStatsAction = createAction({
  auth: campaignMonitorAuth,
  name: 'get_list_stats',
  classification: 'READ',
  displayName: 'Get List Stats',
  description: 'Returns subscriber growth and totals for a list.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns statistics for a Campaign Monitor list: total active, unsubscribed, deleted and bounced subscribers, plus new subscribers, unsubscribes, deletes and bounces today, yesterday, this week, this month and this year. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: listStatsOutputSchema,
  props: {
    clientId: clientId,
    listId: listId,
  },
  async run({ propsValue, auth }) {
    const response = await makeRequest({
      auth: { apiKey: auth.secret_text },
      method: HttpMethod.GET,
      path: `/lists/${propsValue.listId}/stats.json`,
    });
    return response.body;
  },
});
