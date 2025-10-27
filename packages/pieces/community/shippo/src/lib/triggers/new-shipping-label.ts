import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { HttpMethod } from '@activepieces/pieces-common';
import { shippoAuth } from '../..';
import { shippoCommon } from '../common/client';
import dayjs from 'dayjs';

const polling: Polling<PiecePropValueSchema<typeof shippoAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const startDate = lastFetchEpochMS === 0
      ? dayjs().subtract(7, 'days').toISOString()
      : dayjs(lastFetchEpochMS).toISOString();

    const response = await shippoCommon.makeRequest(
      auth as string,
      HttpMethod.GET,
      `/transactions?object_created_gte=${encodeURIComponent(startDate)}&page_size=100`
    );

    const transactions = response.body.results || [];
    
    return transactions.map((transaction: any) => ({
      epochMilliSeconds: dayjs(transaction.object_created).valueOf(),
      data: transaction,
    }));
  },
};

export const newShippingLabel = createTrigger({
  auth: shippoAuth,
  name: 'new_shipping_label',
  displayName: 'New Shipping Label',
  description: 'Triggers when a new shipping label is created',
  props: {},
  type: TriggerStrategy.POLLING,
  sampleData: {},
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
      files: context.files,
    });
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: {},
      files: context.files,
    });
  },
});

