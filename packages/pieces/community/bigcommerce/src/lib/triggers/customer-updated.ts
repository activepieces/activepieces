import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";
export const customerUpdatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_updated',
  displayName: 'Customer Updated',
  description: 'Triggers when a customer is updated',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/customer/updated',
    data: {
      id: '12345',
      type: 'customer',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/customer/updated',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_customer_updated_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_customer_updated_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});