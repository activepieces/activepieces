import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { subscribeWebhook, unsubscribeWebhook, createStoreDropdownProperty, generateWebhookSecret, createWebhookTriggerKey } from '../common/webhook';

export const subscriptionCreatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'subscription_created',
  displayName: 'Subscription Created',
  description: 'Triggers when a new subscription is successfully created',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    const webhookSecret = generateWebhookSecret();

    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      context.propsValue.store_id as unknown as string,
      ['subscription_created'],
      context.webhookUrl,
      webhookSecret
    );

    await context.store?.put(createWebhookTriggerKey('subscription_created'), {
      webhookId: webhookData.data.id,
      secret: webhookSecret,
      storeId: context.propsValue.store_id
    });
  },
  async onDisable(context) {
    const response: { webhookId: string } | null = await context.store?.get(createWebhookTriggerKey('subscription_created'));

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
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
