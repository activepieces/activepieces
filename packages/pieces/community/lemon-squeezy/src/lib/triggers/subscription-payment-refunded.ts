import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { subscribeWebhook, unsubscribeWebhook, createStoreDropdownProperty, generateWebhookSecret, createWebhookTriggerKey } from '../common/webhook';

export const subscriptionPaymentRefundedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'subscription_payment_refunded',
  displayName: 'Subscription Payment Refunded',
  description: 'Triggers when a subscription payment is refunded',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    const webhookSecret = generateWebhookSecret();

    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      context.propsValue.store_id as unknown as string,
      ['subscription_payment_refunded'],
      context.webhookUrl,
      webhookSecret
    );

    await context.store?.put(createWebhookTriggerKey('subscription_payment_refunded'), {
      webhookId: webhookData.data.id,
      secret: webhookSecret,
      storeId: context.propsValue.store_id
    });
  },
  async onDisable(context) {
    const response: { webhookId: string } | null = await context.store?.get(createWebhookTriggerKey('subscription_payment_refunded'));

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    meta: {
      event_name: 'subscription_payment_refunded',
      custom_data: {
        user_id: 123
      }
    },
    data: {
      type: 'subscription_invoices',
      id: '1',
      attributes: {
        store_id: 1,
        subscription_id: 1,
        customer_id: 1,
        order_id: 1,
        product_id: 1,
        variant_id: 1,
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
        billing_reason: 'renewal',
        billing_period_start: '2021-09-17T00:00:00.000000Z',
        billing_period_end: '2021-10-17T23:59:59.000000Z',
        payment_method: 'card',
        payment_method_details: 'Visa ending in 4242',
        due_date: '2021-09-17T09:45:53.000000Z',
        paid_at: '2021-09-17T09:45:53.000000Z',
        refunded_at: '2021-09-17T10:45:53.000000Z'
      }
    }
  }
});
