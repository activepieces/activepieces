import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { DedupeStrategy, pollingHelper } from '@activepieces/pieces-common';
import { systemeioAuth } from '../auth';
import { SystemeioApiClient } from '../api-client';

const polling = {
  strategy: DedupeStrategy.TIMEBASED,
  async items({ auth, lastFetchEpochMS }: any) {
    const client = new SystemeioApiClient(auth.apiKey);
    const sales = await client.getSales({ order: 'desc', limit: 20 });
    return (sales.items || sales).map((s: any) => ({
      epochMilliSeconds: new Date(s.createdAt).getTime(),
      data: s,
    }));
  },
};

export const newSale = createTrigger({
  auth: systemeioAuth,
  name: 'new_sale',
  displayName: 'New Sale',
  description: 'Fires when a new purchase is made within a funnel.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {},
  onEnable(context) {
    return pollingHelper.onEnable(polling, context);
  },
  onDisable(context) {
    return pollingHelper.onDisable(polling, context);
  },
  async run(context) {
    return await pollingHelper.poll(polling, context);
  },
  async test(context) {
    return await pollingHelper.test(polling, context);
  },
}); 