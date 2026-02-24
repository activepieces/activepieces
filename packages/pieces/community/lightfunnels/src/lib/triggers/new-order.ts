import { lightfunnelsAuth } from '../../index';
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { lightfunnelsCommon } from '../common/index';
import { OrderWebhookPayload } from '../common/types';

export const newOrderTrigger = createTrigger({
  auth: lightfunnelsAuth,
  name: 'new_order',
  displayName: 'New Order',
  description: 'Triggers when a new order is created',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const query = `
      mutation CreateWebhookMutation($node: WebhookInput!) {
        createWebhook(node: $node) {
          id
          type
          settings
          url
        }
      }
    `;

    const variables = {
      node: {
        type: 'order/confirmed',
        url: context.webhookUrl,
        settings: {},
      },
    };

    const response = await lightfunnelsCommon.makeGraphQLRequest<{ createWebhook: { id: string } }>(
      context.auth,
      query,
      variables
    );

    await context.store.put('webhook_id', response.data.createWebhook.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhook_id');
    if (webhookId) {
      const query = `
        mutation webhooksDeleteMutation($id: ID!) {
          deleteWebhook(id: $id)
        }
      `;

      await lightfunnelsCommon.makeGraphQLRequest(
        context.auth,
        query,
        { id: webhookId }
      );

      await context.store.delete('webhook_id');
    }
  },
  sampleData: {
    node: {
      id: 'order_123',
      __typename: 'Order',
      _id: 123,
      total: 100,
      account_id: 'acc_123',
      subtotal: 90,
      discount_value: 10,
      normal_discount_value: 10,
      bundle_discount_value: 0,
      pm_discount_value: 0,
      pm_extra_fees: 0,
      name: '#1001',
      notes: '',
      email: 'customer@example.com',
      phone: '+1234567890',
      archived_at: null,
      refunded_amount: 0,
      paid_by_customer: 100,
      net_payment: 100,
      original_total: 100,
      refundable: 100,
      created_at: '2023-01-01T00:00:00Z',
      cancelled_at: null,
      test: false,
      tags: [],
      shipping: 10,
      shipping_discount: 0,
      funnel_id: 'funnel_123',
      store_id: null,
      customer: {
        id: 'cust_123',
        full_name: 'John Doe',
        avatar: '',
        location: '',
      },
      custom: {},
      items: [],
      payments: [],
      shipping_address: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        line1: '123 Main St',
        line2: '',
        country: 'US',
        city: 'New York',
        area: '',
        zip: '10001',
        state: 'NY',
      },
      billing_address: {
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        line1: '123 Main St',
        line2: '',
        country: 'US',
        city: 'New York',
        area: '',
        zip: '10001',
        state: 'NY',
      },
      client_details: {
        ip: '127.0.0.1',
      },
      utm: null,
      currency: 'USD',
    },
  },
  async run(context) {
    const payload = context.payload.body as OrderWebhookPayload;
    return [payload.node];
  },
});
