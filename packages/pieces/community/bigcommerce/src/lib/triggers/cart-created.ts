import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { dedupeWebhookEvent, disableWebhook, enableWebhook } from '../common/shared-runs';
import { webhookEventOutputSchema } from '../common/schemas';

const TRIGGER_NAME = 'cart created';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const SEEN_KEY = `${TRIGGER_NAME}-seen-event-hashes`;
const TRIGGER_SCOPE = 'store/cart/created';

export const cartCreated = createTrigger({
  auth: bigcommerceAuth,
  name: 'cartCreated',
  classification: 'READ',
  displayName: 'Cart Created',
  description: 'Triggers when a new cart is created. Repeated deliveries of the same event within 15 minutes are ignored. BigCommerce may deactivate the webhook after repeated failed deliveries; turn the flow off and on again to re-register it.',
  aiMetadata: {
    description:
      'Fires when a new shopping cart is created in the BigCommerce store (a shopper adds the first item to a fresh cart). The event identifies the new cart. BigCommerce sends only the resource type and ID, not the full record. Repeated deliveries of the same event (same hash) within 15 minutes are ignored.',
  },
  props: {},
  sampleData: {
    producer: 'stores/dxqdddcaklwsso',
    hash: '3610addd127e330084ddddd7ddd09b78abfd1a85',
    created_at: 1761809622,
    store_id: '1003425529',
    scope: 'store/cart/created',
    data: {
      type: 'cart',
      id: 'ss-598f-4c95-813b-0ess950562770d',
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
