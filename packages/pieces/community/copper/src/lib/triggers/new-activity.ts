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
      url: '/activities/search',
      body: {
        minimum_activity_date: lastFetchDate.toISOString(),
        page_size: 200,
        sort_by: 'activity_date',
        sort_direction: 'desc',
      },
    });
    
    const items = Array.isArray(response) ? response : [];
    return items.map((item: any) => ({
      epochMilliSeconds: new Date(item.activity_date || item.date_created).getTime(),
      data: item,
    }));
  },
};

export const newActivityTrigger = createTrigger({
  auth: copperAuth,
  name: 'copper_new_activity',
  displayName: 'New Activity',
  description: 'Fires when a new activity is logged (e.g., call, email, note).',
  type: TriggerStrategy.POLLING,
  sampleData: {
    id: 12345,
    type: 'call',
    details: 'Discussed project requirements',
    activity_date: '2023-01-01T10:30:00Z',
    parent: { type: 'person', id: 67890 },
    user_id: 111,
    date_created: '2023-01-01T10:30:00Z',
    date_modified: '2023-01-01T10:30:00Z',
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
