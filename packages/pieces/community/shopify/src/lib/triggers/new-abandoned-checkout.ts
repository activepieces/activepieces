import {
  Polling,
  DedupeStrategy,
  pollingHelper,
} from '@activepieces/pieces-common';
import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { getAbandonedCheckouts } from '../common';
import { shopifyAuth } from '../..';
import { ShopifyAuth } from '../common/types';

export const newAbandonedCheckout = createTrigger({
  name: 'new_abandoned_checkout',
  auth: shopifyAuth,
  displayName: 'New Abandoned Checkout',
  description: 'Triggers when a checkout is abandoned.',
  props: {},
  sampleData: {},
  type: TriggerStrategy.POLLING,
  async onEnable({ auth, propsValue, store }) {
    await pollingHelper.onEnable(polling, { auth, propsValue, store });
  },
  async onDisable({ auth, propsValue, store }) {
    await pollingHelper.onEnable(polling, { auth, propsValue, store });
  },
  async run({ auth, propsValue, store }) {
    return await pollingHelper.poll(polling, { auth, propsValue, store });
  },
  async test({ auth, propsValue, store }) {
    return await pollingHelper.test(polling, { auth, propsValue, store });
  },
});

const polling: Polling<ShopifyAuth, unknown> = {
  strategy: DedupeStrategy.LAST_ITEM,
  items: async ({ auth, lastItemId }) => {
    const checkouts = await getAbandonedCheckouts(auth, {
      sinceId: lastItemId as string,
    });
    return checkouts.map((checkout) => ({
      id: checkout.id,
      data: checkout,
    }));
  },
};
