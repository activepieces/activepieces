import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { dedupeWebhookEvent, disableWebhook, enableWebhook } from '../common/shared-runs';
import { webhookEventOutputSchema } from '../common/schemas';

const TRIGGER_NAME = 'order updated';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const SEEN_KEY = `${TRIGGER_NAME}-seen-event-hashes`;
const TRIGGER_SCOPE = 'store/order/updated';

export const orderUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'orderUpdated',
  classification: 'READ',
  displayName: 'Order Updated',
  description: 'Triggers when an order is updated. Repeated deliveries of the same event within 15 minutes are ignored. BigCommerce may deactivate the webhook after repeated failed deliveries; turn the flow off and on again to re-register it.',
  aiMetadata: {
    description:
      'Fires when an existing order is updated in the BigCommerce store (any change to the order, not just its status). The event identifies the affected order; pair with Get Order for full details. BigCommerce sends only the resource type and ID, not the full record. Repeated deliveries of the same event (same hash) within 15 minutes are ignored.',
  },
  props: {},
  sampleData: {
    producer: 'stores/xqcaklwsso',
    hash: 'd7b899890f5e0e98a3e074f018b14b07d5d89360',
    created_at: 1761808595,
    store_id: '1003425529',
    scope: 'store/order/updated',
    data: {
      type: 'order',
      id: 2,
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
