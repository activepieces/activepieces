import {
  createTrigger,
  TriggerStrategy,
  StaticPropsValue,
  AppConnectionValueForAuthProperty,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { ShippoClient } from '../client';
import { shippoAuth } from '../auth';

const props = {};

const polling: Polling<AppConnectionValueForAuthProperty<typeof shippoAuth>, StaticPropsValue<typeof props>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth,  lastFetchEpochMS }) => {
    const client = new ShippoClient({
      apiToken: auth.secret_text,
    });

    const result = await client.listOrders({
      results_per_page: 100,
    });
    console.log('Fetched orders:', JSON.stringify(result));
    const filteredOrders = result.results.filter((order) => {
      const orderTime = dayjs(order.placed_at).valueOf();
      return orderTime > lastFetchEpochMS;
    });

    return filteredOrders.map((order: any) => ({
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
  props,
  sampleData: {
    object_id: '4f2bc588e4e5446cb3f9fdb7cd5e190b',
    object_owner: 'shippotle@shippo.com',
    order_number: '#1068',
    order_status: 'PAID',
    placed_at: '2016-09-23T01:28:12Z',
    to_address: {
      object_created: '2016-09-23T01:38:56Z',
      object_updated: '2016-09-23T01:38:56Z',
      object_id: 'd799c2679e644279b59fe661ac8fa488',
      object_owner: 'shippotle@shippo.com',
      is_complete: true,
      validation_results: {},
      name: 'Mr Hippo',
      company: 'Shippo',
      street1: '215 Clayton St.',
      street2: '',
      city: 'San Francisco',
      state: 'CA',
      zip: '94117',
      country: 'US',
      phone: '15553419393',
      email: 'shippotle@shippo.com',
      is_residential: null,
      metadata: '',
    },
    from_address: null,
    line_items: [
      {
        object_id: 'abf7d5675d744b6ea9fdb6f796b28f28',
        title: 'Hippo Magazines',
        variant_title: '',
        sku: 'HM-123',
        quantity: 1,
        total_price: '12.10',
        currency: 'USD',
        weight: '0.40',
        weight_unit: 'lb',
        manufacture_country: null,
        max_ship_time: null,
        max_delivery_time: null,
        description: null,
      },
    ],
    shipping_cost: '12.83',
    shipping_cost_currency: 'USD',
    shipping_method: 'USPS First Class Package',
    shop_app: 'Shippo',
    subtotal_price: '12.10',
    total_price: '24.93',
    total_tax: '0.00',
    currency: 'USD',
    transactions: [],
    weight: '0.40',
    weight_unit: 'lb',
    notes: null,
  },
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
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
      files: context.files,
    });
  },
});
