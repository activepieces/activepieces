import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createStoreDropdownProperty, disableWebhook, enableWebhook, handleWebhook } from '../common/webhook';
import { webhookSchemas } from '../common/output-schemas';

export const subscriptionPaymentRefundedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'subscription_payment_refunded',
  classification: 'READ',
  displayName: 'Subscription Payment Refunded',
  description: 'Triggers when a subscription payment is refunded',
  aiMetadata: {
    description: 'Fires when a subscription payment in Lemon Squeezy is refunded. Represents the refunded subscription invoice.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    await enableWebhook({
      auth: context.auth,
      store: context.store,
      storeId: context.propsValue.store_id,
      webhookUrl: context.webhookUrl,
      eventName: 'subscription_payment_refunded',
    });
  },
  async onDisable(context) {
    await disableWebhook({ auth: context.auth, store: context.store, eventName: 'subscription_payment_refunded' });
  },
  async run(context) {
    return handleWebhook({ payload: context.payload, store: context.store, eventName: 'subscription_payment_refunded' });
  },
  outputSchema: webhookSchemas.subscriptionInvoice,
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
