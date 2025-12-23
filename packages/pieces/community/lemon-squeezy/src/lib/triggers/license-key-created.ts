import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { subscribeWebhook, unsubscribeWebhook, createStoreDropdownProperty, generateWebhookSecret, createWebhookTriggerKey } from '../common/webhook';

export const licenseKeyCreatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'license_key_created',
  displayName: 'License Key Created',
  description: 'Triggers when a license key is created from a new order',
  type: TriggerStrategy.WEBHOOK,
  props: {
    store_id: createStoreDropdownProperty()
  },
  async onEnable(context) {
    const webhookSecret = generateWebhookSecret();

    const webhookData = await subscribeWebhook(
      context.auth.secret_text,
      context.propsValue.store_id as unknown as string,
      ['license_key_created'],
      context.webhookUrl,
      webhookSecret
    );

    await context.store?.put(createWebhookTriggerKey('license_key_created'), {
      webhookId: webhookData.data.id,
      secret: webhookSecret,
      storeId: context.propsValue.store_id
    });
  },
  async onDisable(context) {
    const response: { webhookId: string } | null = await context.store?.get(createWebhookTriggerKey('license_key_created'));

    if (response !== null && response !== undefined) {
      await unsubscribeWebhook(context.auth.secret_text, response.webhookId);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
  sampleData: {
    meta: {
      event_name: 'license_key_created',
      custom_data: {
        user_id: 123
      }
    },
    data: {
      type: 'license_keys',
      id: '1',
      attributes: {
        store_id: 1,
        order_id: 1,
        order_item_id: 1,
        product_id: 1,
        variant_id: 1,
        user_name: 'John Doe',
        user_email: 'johndoe@example.com',
        key: 'ABCD-EFGH-IJKL-MNOP-QRST-UVWX',
        activation_limit: 1,
        usage: 0,
        status: 'active',
        status_formatted: 'Active',
        expires_at: null,
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T09:45:53.000000Z',
        test_mode: false
      }
    }
  }
});
