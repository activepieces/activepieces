import {
  createTrigger,
  TriggerStrategy,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import { sageAccountingAuth } from '../auth';
import { sageAccountingClient } from '../client';
import { newStockItemTriggerOutputSchema } from '../output-schemas';

const polling: Polling<
  AppConnectionValueForAuthProperty<typeof sageAccountingAuth>,
  Record<string, never>
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const items = await sageAccountingClient.listAll<StockItemPollRecord>({
      accessToken: auth.access_token,
      path: sageAccountingClient.paths.stockItems,
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

export const newStockItemTrigger = createTrigger({
  auth: sageAccountingAuth,
  name: 'new_stock_item',
  classification: 'READ',
  displayName: 'New Stock Item',
  description: 'Triggers when a new stock item is created in Sage Accounting.',
  aiMetadata: {
    description: 'Fires once for each new stock item created in Sage Accounting.',
  },
  outputSchema: newStockItemTriggerOutputSchema,
  props: {},
  sampleData: {
    id: 'st1st2st3',
    item_code: 'WIDGET-01',
    description: 'Blue Widget',
    quantity_in_stock: 100,
    cost_price: 5,
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

type StockItemPollRecord = {
  id: string;
  item_code: string;
  description: string;
  quantity_in_stock: number | null;
  cost_price: number | null;
  active: boolean;
  created_at: string;
};
