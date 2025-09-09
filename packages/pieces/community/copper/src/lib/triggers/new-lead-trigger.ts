import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { copperAuth } from '../../index';
import { copperRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';

const polling: Polling<{ api_key: string; email: string }, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const lastFetchDate = new Date(lastFetchEpochMS);
    
    const response = await copperRequest({
      auth,
      method: HttpMethod.POST,
      url: '/leads/search',
      body: {
        minimum_date_created: Math.floor(lastFetchDate.getTime() / 1000),
        page_size: 200,
        sort_by: 'date_created',
        sort_direction: 'desc',
      },
    });
    
    const items = Array.isArray(response) ? response : [];
    return items.map((item: any) => ({
      epochMilliSeconds: new Date(item.date_created).getTime(),
      data: item,
    }));
  },
};

export const newLeadTrigger = createTrigger({
  auth: copperAuth,
  name: 'copper_new_lead',
  displayName: 'New Lead',
  description: 'Fires when a new lead is created.',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345,
    name: 'Jane Smith',
    email: { email: 'jane@example.com', category: 'work' },
    company_name: 'Example Corp',
    status: 'New',
    date_created: '2023-01-01T00:00:00Z',
    date_modified: '2023-01-01T00:00:00Z',
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
