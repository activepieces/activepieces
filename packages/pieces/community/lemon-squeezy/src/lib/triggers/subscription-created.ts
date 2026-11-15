import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createStoreDropdownProperty, disableWebhook, enableWebhook, handleWebhook } from '../common/webhook';
import { webhookSchemas } from '../common/output-schemas';

export const subscriptionCreatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'subscription_created',
  classification: 'READ',
  displayName: 'Subscription Created',
  description: 'Triggers when a new subscription is successfully created',
  aiMetadata: {
    description: 'Fires when a new subscription is created in Lemon Squeezy (a customer subscribes to a recurring plan). Represents the new subscription record, including customer, product/variant, status, and renewal dates.',
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
      eventName: 'subscription_created',
    });
  },
  async onDisable(context) {
    await disableWebhook({ auth: context.auth, store: context.store, eventName: 'subscription_created' });
  },
  async run(context) {
    return handleWebhook({ payload: context.payload, store: context.store, eventName: 'subscription_created' });
  },
  outputSchema: webhookSchemas.subscription,
  sampleData: {
    meta: {
      event_name: 'subscription_created',
      custom_data: {
        user_id: 123
      }
    },
    data: {
      type: 'subscriptions',
      id: '1',
      attributes: {
        store_id: 1,
        customer_id: 1,
        order_id: 1,
        order_item_id: 1,
        product_id: 1,
        variant_id: 1,
        product_name: 'Lemonade - 2 years',
        variant_name: 'Default',
        user_name: 'John Doe',
        user_email: 'johndoe@example.com',
        currency: 'USD',
        currency_rate: '1.0000',
        status: 'active',
        status_formatted: 'Active',
        trial_ends_at: null,
        ends_at: '2023-08-17T09:45:53.000000Z',
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T09:45:53.000000Z',
        test_mode: false,
        pause_mode: null,
        cancelled_at: null,
        billing_anchor: 17,
        billing_anchor_type: 'day_of_month',
        first_subscription_item: {
          id: 1,
          subscription_id: 1,
          price_id: 1,
          quantity: 1,
          is_usage_based: false,
          created_at: '2021-08-17T09:45:53.000000Z',
          updated_at: '2021-08-17T09:45:53.000000Z'
        },
        urls: {
          customer_portal: 'https://app.lemonsqueezy.com/subscription/1/customer-portal',
          update_payment_method: 'https://app.lemonsqueezy.com/subscription/1/update-payment-method'
        },
        renews_at: '2021-09-17T09:45:53.000000Z'
      }
    }
  }
});
