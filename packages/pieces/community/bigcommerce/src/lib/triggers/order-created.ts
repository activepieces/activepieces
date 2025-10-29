import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";
export const orderCreatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'order_created',
  displayName: 'Order Created',
  description: 'Triggers when a new order is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/order/created',
    data: {
      id: '12345',
      type: 'order',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/order/created',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_order_created_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_order_created_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
