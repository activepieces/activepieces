import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";
export const cartCreatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'cart_created',
  displayName: 'Cart Created',
  description: 'Triggers when a new cart is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/cart/created',
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
        scope: 'store/cart/created',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_cart_created_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_cart_created_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
