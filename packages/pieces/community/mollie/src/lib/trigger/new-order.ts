import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mollieAuth } from '../..';
import { mollieCommon } from '../common';

export const mollieNewOrder = createTrigger({
  auth: mollieAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Triggers when an order status changes',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Store the webhook URL for reference
    await context.store?.put<WebhookInformation>('_mollie_order_webhook', {
      webhookUrl: context.webhookUrl,
    });
  },
  async onDisable(context) {
    // Clean up stored webhook information
    await context.store?.delete('_mollie_order_webhook');
  },
  async run(context) {
    const payloadBody = context.payload.body as PayloadBody;

    // Mollie sends a POST with 'id' parameter containing the order ID
    if (payloadBody.id && payloadBody.id.startsWith('ord_')) {
      // Fetch the full order details using the ID
      const order = await mollieCommon.getResource(
        context.auth as string,
        'orders',
        payloadBody.id
      );
      return [order];
    }

    return [];
  },
  async test(context) {
    // Return sample data for testing
    return [mollieNewOrder.sampleData];
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

type PayloadBody = {
  id: string;
};

interface WebhookInformation {
  webhookUrl: string;
}
