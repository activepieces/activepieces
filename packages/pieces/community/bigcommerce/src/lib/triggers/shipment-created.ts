import { createTrigger, TriggerStrategy } from "@activepieces/pieces-framework";
import { bigcommerceAuth, makeRequest } from "../common/common";
import { HttpMethod } from "@activepieces/pieces-common";


export const shipmentCreatedTrigger = createTrigger({
  auth: bigcommerceAuth,
  name: 'shipment_created',
  displayName: 'Shipment Created',
  description: 'Triggers when a new shipment is created',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    scope: 'store/shipment/created',
    data: {
      id: '12345',
      type: 'shipment',
      orderId: '67890',
    },
    created_at: Date.now(),
  },
  async onEnable(context) {
    const webhook = await makeRequest(
      context.auth,
      '/v3/hooks',
      HttpMethod.POST,
      {
        scope: 'store/shipment/created',
        destination: context.webhookUrl,
        is_active: true,
      }
    );
    await context.store.put('_shipment_created_webhook_id', webhook.body.data.id);
  },
  async onDisable(context) {
    const webhookId = await context.store.get('_shipment_created_webhook_id');
    if (webhookId) {
      await makeRequest(context.auth, `/v3/hooks/${webhookId}`, HttpMethod.DELETE);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});