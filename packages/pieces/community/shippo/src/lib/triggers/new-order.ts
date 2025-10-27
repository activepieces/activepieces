import { createTrigger, TriggerStrategy, PiecePropValueSchema, Property } from '@activepieces/pieces-framework';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { ShippoClient } from '../client';
import { shippoAuth } from '../auth';

const polling: Polling<PiecePropValueSchema<typeof shippoAuth>, { order_status?: string }> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const client = new ShippoClient({
      apiToken: auth,
    });

    const startDate = lastFetchEpochMS === 0 
      ? dayjs().subtract(1, 'day').toISOString()
      : dayjs(lastFetchEpochMS).toISOString();

    const result = await client.listOrders({
      results_per_page: 100,
      order_status: propsValue.order_status || undefined,
    });
    
    const newOrders = result.results.filter(order => {
      return dayjs(order.placed_at).valueOf() > lastFetchEpochMS;
    });

    return newOrders.map((order: any) => ({
      epochMilliSeconds: dayjs(order.placed_at).valueOf(),
      data: order,
    }));
  },
};

export const newOrder = createTrigger({
  name: 'new_order',
  displayName: 'New Order',
  description: 'Trigger when a new order is created',
  type: TriggerStrategy.POLLING,
  auth: shippoAuth,
  props: {
    order_status: Property.StaticDropdown({
      displayName: 'Order Status Filter',
      description: 'Filter orders by status (optional)',
      required: false,
      options: {
        options: [
          { label: 'All Statuses', value: '' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Unpaid', value: 'UNPAID' },
          { label: 'Cancelled', value: 'CANCELLED' },
          { label: 'Refunded', value: 'REFUNDED' },
          { label: 'On Hold', value: 'ONHOLD' },
        ],
      },
    }),
  },
  sampleData: {
    "order_number": "ORDER_123",
    "order_status": "PAID",
    "placed_at": "2023-10-01T10:00:00Z",
    "sender_address": {
      "name": "Store Name",
      "street1": "123 Main St",
      "city": "San Francisco",
      "state": "CA",
      "zip": "94105",
      "country": "US"
    },
    "shipping_address": {
      "name": "Customer Name",
      "street1": "456 Oak Ave",
      "city": "New York",
      "state": "NY",
      "zip": "10001",
      "country": "US"
    },
    "line_items": [
      {
        "title": "Product Name",
        "sku": "SKU123",
        "quantity": 1,
        "total_price": "29.99",
        "weight": 0.5,
        "weight_unit": "lb"
      }
    ],
    "total_price": "29.99",
    "total_tax": "2.40",
    "currency": "USD"
  },
  async onEnable(context) {
    await pollingHelper.onEnable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    await pollingHelper.onDisable(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files
    });
  },
  async test(context): Promise<any> {
    const result = await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files
    });

    if(!result || result.length === 0){
      return [newOrder.sampleData]
    }

    return result;
  },
});