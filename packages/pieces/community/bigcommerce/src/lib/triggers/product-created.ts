import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";

export const productCreatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'product_created',
  displayName: 'Product Created',
  description: 'Triggers when a new product is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/product/created',
    data: {
      id: '12345',
      type: 'product',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/product/created',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_product_created_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_product_created_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});