import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { bigcommerceAuth, makeRequest } from '../common/common';
import { HttpMethod } from '@activepieces/pieces-common';
export const abandonedCartTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'abandoned_cart',
  displayName: 'Abandoned Cart',
  description: 'Triggers when a cart is abandoned',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/cart/abandoned',
    data: {
      id: '12345',
      type: 'cart',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/cart/abandoned',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_abandoned_cart_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_abandoned_cart_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});