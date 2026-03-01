import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { subscribeWebhook, unsubscribeWebhook, createStoreDropdownProperty, generateWebhookSecret, createWebhookTriggerKey } from '../common/webhook';

export const affiliateActivatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'affiliate_activated',
  displayName: 'Affiliate Activated',
  description: 'Triggers when an affiliate is activated',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    const webhookSecret = generateWebhookSecret();

    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      context.propsValue.store_id as unknown as string,
      ['affiliate_activated'],
      context.webhookUrl,
      webhookSecret
    );

    await context.store?.put(createWebhookTriggerKey('affiliate_activated'), {
      webhookId: webhookData.data.id,
      secret: webhookSecret,
      storeId: context.propsValue.store_id
    });
  },
  async onDisable(context) {
    const response: { webhookId: string } | null = await context.store?.get(createWebhookTriggerKey('affiliate_activated'));

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    meta: {
      event_name: 'affiliate_activated',
      custom_data: {
        user_id: 123
      }
    },
    data: {
      type: 'affiliates',
      id: '1',
      attributes: {
        store_id: 1,
        user_id: 1,
        email: 'affiliate@example.com',
        name: 'John Affiliate',
        status: 'active',
        status_formatted: 'Active',
        commission_rate: '10.00',
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T10:45:53.000000Z',
        test_mode: false
      }
    }
  }
});
