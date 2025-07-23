import { createTrigger, TriggerStrategy, PiecePropValueSchema, Polling, DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { systemeioAuth } from '../../';
import { SystemeioApiClient } from '../auth';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof systemeioAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const client = new SystemeioApiClient(auth as string);
    const result = await client.request({
      method: 'GET',
      path: '/sales',
      queryParams: {
        startingAfter: lastFetchEpochMS ? dayjs(lastFetchEpochMS).toISOString() : undefined,
        limit: '100',
        order: 'desc',
      },
    });
    return result.items.map((sale: any) => ({
      epochMilliSeconds: dayjs(sale.createdAt).valueOf(),
      data: sale,
    }));
  },
};

export const systemeioNewSaleTrigger = createTrigger({
  auth: systemeioAuth,
  name: 'new_sale',
  displayName: 'New Sale',
  description: 'Triggers when a new purchase is made in a funnel',
  props: {},
  sampleData: {
    id: '456',
    amount: 99.99,
    funnelId: '789',
    createdAt: '2025-07-23T10:00:00Z',
  },
  type: TriggerStrategy.POLLING,
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