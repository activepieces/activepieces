import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { copperAuth, CopperAuth } from '../common/auth';
import { copperRequest } from '../common/http';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<CopperAuth, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const lastFetchDate = new Date(lastFetchEpochMS);
    const response = await copperRequest({
      auth,
      method: HttpMethod.POST,
      url: '/opportunities/search',
      body: {
        minimum_date_modified: lastFetchDate.toISOString(),
        page_size: 200,
        sort_by: 'date_modified',
        sort_direction: 'desc',
      },
    });
    
    const items = Array.isArray(response) ? response : [];
    return items.map((item: any) => ({
      epochMilliSeconds: new Date(item.date_modified).getTime(),
      data: item,
    }));
  },
};

export const updatedOpportunityTrigger = createTrigger({
  auth: copperAuth,
  name: 'copper_updated_opportunity',
  displayName: 'Updated Opportunity',
  description: 'Fires when an opportunity changes.',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345,
    name: 'Big Sales Deal',
    monetary_value: 50000,
    status: 'Open',
    priority: 'High',
    pipeline_id: 1,
    pipeline_stage_id: 2,
    close_date: '2023-02-01T00:00:00Z',
    date_created: '2023-01-01T00:00:00Z',
    date_modified: '2023-01-01T12:00:00Z',
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, context);
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
});
