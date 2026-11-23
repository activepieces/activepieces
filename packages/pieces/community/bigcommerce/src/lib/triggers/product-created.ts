import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { dedupeWebhookEvent, disableWebhook, enableWebhook } from '../common/shared-runs';
import { webhookEventOutputSchema } from '../common/schemas';

const TRIGGER_NAME = 'product created';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const SEEN_KEY = `${TRIGGER_NAME}-seen-event-hashes`;
const TRIGGER_SCOPE = 'store/product/created';

export const productCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'productCreated',
  classification: 'READ',
  displayName: 'Product Created',
  description: 'Triggers when a new product is created. Repeated deliveries of the same event within 15 minutes are ignored. BigCommerce may deactivate the webhook after repeated failed deliveries; turn the flow off and on again to re-register it.',
  aiMetadata: {
    description:
      'Fires when a new product is added to the BigCommerce store catalog. The event identifies the new product. BigCommerce sends only the resource type and ID, not the full record. Repeated deliveries of the same event (same hash) within 15 minutes are ignored.',
  },
  props: {},
  sampleData: {
    producer: 'stores/xqcaklwsso',
    hash: 'c6db17090e98d2c58c0cb1988b5e9ace48215e22',
    created_at: 1761808831,
    store_id: '1003425529',
    scope: 'store/product/created',
    data: {
      type: 'product',
      id: 113,
    },
  },
  outputSchema: webhookEventOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await enableWebhook({
      auth: context.auth.props,
      scope: TRIGGER_SCOPE,
      webhookUrl: context.webhookUrl,
      store: context.store,
      cacheKey: CACHE_KEY,
    });
  },
  async onDisable(context) {
    await disableWebhook({
      auth: context.auth.props,
      store: context.store,
      cacheKey: CACHE_KEY,
    });
  },
  async run(context) {
    return await dedupeWebhookEvent({
      store: context.store,
      storeKey: SEEN_KEY,
      body: context.payload.body,
    });
  },
});
