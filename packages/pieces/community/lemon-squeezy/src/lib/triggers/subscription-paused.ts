import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createStoreDropdownProperty, disableWebhook, enableWebhook, handleWebhook } from '../common/webhook';
import { webhookSchemas } from '../common/output-schemas';

export const subscriptionPausedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'subscription_paused',
  classification: 'READ',
  displayName: 'Subscription Paused',
  description: 'Triggers when a subscription\'s payment collection is paused',
  aiMetadata: {
    description: 'Fires when a subscription in Lemon Squeezy has its payment collection paused. Represents the subscription with its pause mode set, indicating billing is temporarily suspended.',
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
      eventName: 'subscription_paused',
    });
  },
  async onDisable(context) {
    await disableWebhook({ auth: context.auth, store: context.store, eventName: 'subscription_paused' });
  },
  async run(context) {
    return handleWebhook({ payload: context.payload, store: context.store, eventName: 'subscription_paused' });
  },
  outputSchema: webhookSchemas.subscription,
  sampleData: {
    meta: {
      event_name: 'subscription_paused',
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
        status: 'on_trial',
        status_formatted: 'On trial',
        trial_ends_at: '2021-09-17T09:45:53.000000Z',
        ends_at: '2023-08-17T09:45:53.000000Z',
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T10:45:53.000000Z',
        test_mode: false,
        pause_mode: 'free',
        cancelled_at: null,
        billing_anchor: 17,
        billing_anchor_type: 'day_of_month',
        renews_at: null
      }
    }
  }
});
