import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { createStoreDropdownProperty, disableWebhook, enableWebhook, handleWebhook } from '../common/webhook';
import { webhookSchemas } from '../common/output-schemas';

export const affiliateActivatedTrigger = createTrigger({
  auth: lemonSqueezyAuth,
  name: 'affiliate_activated',
  classification: 'READ',
  displayName: 'Affiliate Activated',
  description: 'Triggers when an affiliate is activated',
  aiMetadata: {
    description: 'Fires when an affiliate is activated in a Lemon Squeezy store. Represents the activated affiliate record, marking them eligible to earn commissions.',
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
      eventName: 'affiliate_activated',
    });
  },
  async onDisable(context) {
    await disableWebhook({ auth: context.auth, store: context.store, eventName: 'affiliate_activated' });
  },
  async run(context) {
    return handleWebhook({ payload: context.payload, store: context.store, eventName: 'affiliate_activated' });
  },
  outputSchema: webhookSchemas.affiliate,
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
