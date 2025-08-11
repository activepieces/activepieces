import { createTrigger, TriggerStrategy, PiecePropValueSchema } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';
import { DedupeStrategy, Polling, pollingHelper } from '@activepieces/pieces-common';

export const mollieNewOrder = createTrigger({
  auth: mollieAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Triggers when a new order is created',
  props: {},
  type: TriggerStrategy.POLLING,
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
  async test(context) {
    return await pollingHelper.test(polling, {
      auth: context.auth,
      store: context.store,
      propsValue: context.propsValue,
      files: context.files,
    });
  },
  sampleData: {
    id: 'ord_kEn1PlbGa',
    profileId: 'pfl_QkEhN94Ba',
    method: 'ideal',
    mode: 'test',
    amount: {
      value: '100.00',
      currency: 'EUR',
    },
    status: 'created',
    isCancelable: true,
    metadata: {
      order_id: '12345',
    },
    createdAt: '2024-01-15T12:00:00+00:00',
    expiresAt: '2024-01-15T12:15:00+00:00',
    lines: [
      {
        id: 'odl_dgtxyl',
        orderId: 'ord_kEn1PlbGa',
        name: 'Product Name',
        sku: 'SKU123',
        type: 'physical',
        status: 'created',
        quantity: 2,
        unitPrice: {
          value: '50.00',
          currency: 'EUR',
        },
        totalAmount: {
          value: '100.00',
          currency: 'EUR',
        },
      },
    ],
    billingAddress: {
      streetAndNumber: '123 Main St',
      postalCode: '12345',
      city: 'Amsterdam',
      country: 'NL',
    },
    redirectUrl: 'https://example.com/redirect',
    webhookUrl: 'https://example.com/webhook',
    _links: {
      self: {
        href: 'https://api.mollie.com/v2/orders/ord_kEn1PlbGa',
        type: 'application/hal+json',
      },
      checkout: {
        href: 'https://checkout.mollie.com/order/ord_kEn1PlbGa',
        type: 'text/html',
      },
      dashboard: {
        href: 'https://www.mollie.com/dashboard/org_12345678/orders/ord_kEn1PlbGa',
        type: 'text/html',
      },
    },
  },
});

const polling: Polling<PiecePropValueSchema<typeof mollieAuth>, Record<string, never>> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, lastFetchEpochMS }) => {
    const currentValues = await mollieCommon.listResources(
      auth as string,
      'orders',
      {
        limit: 250,
        ...(lastFetchEpochMS && {
          from: new Date(lastFetchEpochMS).toISOString(),
        }),
      }
    );
    
    const items = currentValues._embedded?.orders || [];
    
    return items.map((order: any) => ({
      epochMilliSeconds: new Date(order.createdAt).getTime(),
      data: order,
    }));
  },
};