import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { dedupeWebhookEvent, disableWebhook, enableWebhook } from '../common/shared-runs';
import { customerAddressEventOutputSchema } from '../common/schemas';

const TRIGGER_NAME = 'customer address updated';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const SEEN_KEY = `${TRIGGER_NAME}-seen-event-hashes`;
const TRIGGER_SCOPE = 'store/customer/address/updated';

export const customerAddressUpdated = createTrigger({
  auth: bigcommerceAuth,
  name: 'customerAddressUpdated',
  classification: 'READ',
  displayName: 'Customer Address Updated',
  description: 'Triggers when an existing customer address is updated. Data ID is the address ID; the customer ID is in Data > Address > Customer ID. Repeated deliveries of the same event within 15 minutes are ignored. BigCommerce may deactivate the webhook after repeated failed deliveries; turn the flow off and on again to re-register it.',
  aiMetadata: {
    description:
      'Fires when a customer address is updated in the BigCommerce store. data.id is the ADDRESS id, not the customer id; the customer id is data.address.customer_id. BigCommerce sends only these ids, not the full address; use Search Customer Address (AI) with that customer id to read it. Repeated deliveries of the same event (same hash) within 15 minutes are ignored.',
  },
  props: {},
  sampleData:{
    producer: 'stores/xqcaklwsso',
    hash: 'd7b899890f5e0e98a3e074f018b14b07d5d89360',
    created_at: 1761808595,
    store_id: '1003425529',
    scope: 'store/customer/address/updated',
    data: {
      type: 'customer',
      id: 60,
      address: {
        customer_id: 2,
      },
    },
  },
  outputSchema: customerAddressEventOutputSchema,
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
