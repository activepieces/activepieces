import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";
export const customerAddressCreatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'customer_address_created',
  displayName: 'Customer Address Created',
  description: 'Triggers when a new customer address is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/customer/address/created',
    data: {
      id: '12345',
      type: 'customer',
      address_id: '67890',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/customer/address/created',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_customer_address_created_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_customer_address_created_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
