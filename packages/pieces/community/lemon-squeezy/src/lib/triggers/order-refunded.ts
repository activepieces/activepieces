import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { subscribeWebhook, unsubscribeWebhook, createStoreDropdownProperty, generateWebhookSecret, createWebhookTriggerKey } from '../common/webhook';

export const orderRefundedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'order_refunded',
  displayName: 'Order Refunded',
  description: 'Triggers when a full or partial refund is made on an order',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    const webhookSecret = generateWebhookSecret();

    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      context.propsValue.store_id as unknown as string,
      ['order_refunded'],
      context.webhookUrl,
      webhookSecret
    );

    await context.store?.put(createWebhookTriggerKey('order_refunded'), {
      webhookId: webhookData.data.id,
      secret: webhookSecret,
      storeId: context.propsValue.store_id
    });
  },
  async onDisable(context) {
    const response: { webhookId: string } | null = await context.store?.get(createWebhookTriggerKey('order_refunded'));

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    meta: {
      event_name: 'order_refunded',
      custom_data: {
        user_id: 123
      }
    },
    data: {
      type: 'orders',
      id: '1',
      attributes: {
        store_id: 1,
        customer_id: 1,
        product_id: 1,
        variant_id: 1,
        user_name: 'John Doe',
        user_email: 'johndoe@example.com',
        currency: 'USD',
        currency_rate: '1.0000',
        subtotal: 999,
        discount_total: 0,
        tax: 200,
        total: 1199,
        subtotal_usd: 999,
        discount_total_usd: 0,
        tax_usd: 200,
        total_usd: 1199,
        subtotal_formatted: '$9.99',
        discount_total_formatted: '$0.00',
        tax_formatted: '$2.00',
        total_formatted: '$11.99',
        status: 'refunded',
        status_formatted: 'Refunded',
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T10:45:53.000000Z',
        test_mode: false,
        order_number: 1,
        refunded_amount: 1199,
        refunded_amount_formatted: '$11.99'
      }
    }
  }
});
