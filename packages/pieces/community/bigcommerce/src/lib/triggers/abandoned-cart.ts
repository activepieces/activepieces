import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { bigCommerceApiService } from '../common/requests';

const TRIGGER_NAME = 'abandoned cart';
const CACHE_KEY = `${TRIGGER_NAME}-trigger-store-key`;
const TRIGGER_SCOPE = 'store/cart/abandoned';

export const abandonedCart = createTrigger({
  auth: bigcommerceAuth,
  name: 'abandonedCart',
  displayName: 'Abandoned Cart',
  description: 'Triggers when a cart is abandoned',
  props: {},
  sampleData:{
    producer: 'stores/dxqdddcaklwsso',
    hash: '3610addd127e330084ddddd7ddd09b78abfd1a85',
    created_at: 1761809622,
    store_id: '1003425529',
    scope: 'store/cart/abandoned',
    data: {
      type: 'cart',
      id: 'ss-598f-4c95-813b-0ess950562770d',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const webhook = await bigCommerceApiService.createWebhook({
      auth: context.auth.props,
      payload: {
        scope: TRIGGER_SCOPE,
        destination: context.webhookUrl,
        is_active: true,
      },
    });

    await context.store.put(CACHE_KEY, webhook.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get(CACHE_KEY) as string;

    if (webhookId) {
      await bigCommerceApiService.deleteWebhook({
        auth: context.auth.props,
        webhookId,  
      }).then(async () => {
        await context.store.delete(CACHE_KEY)
      })
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
