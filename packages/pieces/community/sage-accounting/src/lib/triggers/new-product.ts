import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newProductTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<ProductPollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.products,
      query: {
        ...(lastFetchEpochMS > 0
          ? { updated_or_created_since: new Date(lastFetchEpochMS).toISOString() }
          : {}),
      },
    });

    return items.map((record) => ({
      epochMilliSeconds: new Date(record.created_at).getTime(),
      data: record,
    }));
  },
};

export const newProductTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_product',
  classification: 'READ',
  displayName: 'New Product',
  description: 'Triggers when a new product is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new product created in Sage Accounting.',
  },
  outputSchema: newProductTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'p1p2p3p4',
    description: 'Consulting Hours',
    item_code: 'CONSULT-01',
    cost_price: 50,
    active: true,
    created_at: '2026-01-15T10:30:00Z',
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

type ProductPollRecord = {
  id: string;
  description: string;
  item_code: string | null;
  cost_price: number | null;
  active: boolean;
  created_at: string;
};
