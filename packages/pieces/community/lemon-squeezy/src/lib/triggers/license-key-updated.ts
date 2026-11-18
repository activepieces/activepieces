import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createStoreDropdownProperty, disableWebhook, enableWebhook, handleWebhook } from '../common/webhook';
import { webhookSchemas } from '../common/output-schemas';

export const licenseKeyUpdatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'license_key_updated',
  classification: 'READ',
  displayName: 'License Key Updated',
  description: 'Triggers when a license key is updated',
  aiMetadata: {
    description: 'Fires when an existing license key in Lemon Squeezy is updated (for example its status, activation limit, or expiry changes). Represents the license key in its updated state.',
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
      eventName: 'license_key_updated',
    });
  },
  async onDisable(context) {
    await disableWebhook({ auth: context.auth, store: context.store, eventName: 'license_key_updated' });
  },
  async run(context) {
    return handleWebhook({ payload: context.payload, store: context.store, eventName: 'license_key_updated' });
  },
  outputSchema: webhookSchemas.licenseKey,
  sampleData: {
    meta: {
      event_name: 'license_key_updated',
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
        activation_limit: 2,
        usage: 1,
        status: 'active',
        status_formatted: 'Active',
        expires_at: null,
        created_at: '2021-08-17T09:45:53.000000Z',
        updated_at: '2021-08-17T10:45:53.000000Z',
        test_mode: false
      }
    }
  }
});
