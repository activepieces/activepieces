import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { pollingHelper, DedupeStrategy, Polling, HttpMethod, httpClient } from '@activepieces/pieces-common';

interface SystemeIoSale {
  id: string;
  contactId: string;
  amount: number;
  currency: string;
  createdAt: string;
  [key: string]: unknown;
}

const polling: Polling<string, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.systeme.io/api/sales',
      headers: {
        'X-API-Key': auth,
      },
    });
    const items: SystemeIoSale[] = response.body.items || [];
    return items
      .filter((item) => {
        const createdAt = new Date(item.createdAt).getTime();
        return createdAt > (lastFetchEpochMS ?? 0);
      })
      .map((item) => ({
        epochMilliSeconds: new Date(item.createdAt).getTime(),
        data: item,
      }));
  },
};

export const newSale = createTrigger({
  name: 'newSale',
  displayName: 'New Sale',
  description: 'Triggers when a new funnel purchase is made in systeme.io.',
  type: TriggerStrategy.POLLING,
  props: {},
  sampleData: {
    id: 'sample-sale-id',
    contactId: 'sample-contact-id',
    amount: 100,
    currency: 'USD',
    createdAt: '2024-01-01T00:00:00Z',
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth as string,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
}); 