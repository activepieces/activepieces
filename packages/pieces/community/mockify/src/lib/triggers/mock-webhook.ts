import { createTrigger, StaticPropsValue, TriggerContext, TriggerStrategy, Property } from "@activepieces/pieces-framework";

export const mockWebhookTrigger = createTrigger({
  name: "mock_webhook",
  displayName: "Mock Request Received",
  description: "Triggers whenever an HTTP request is made to this mock endpoint.",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    body: { hello: "world" },
    headers: { "content-type": "application/json" },
    queryParams: { id: "123" },
  },
  async onEnable(context: TriggerContext<StaticPropsValue>) {
    // Not needed for a pure webhook trigger
  },
  async onDisable(context: TriggerContext<StaticPropsValue>) {
    // Not needed for a pure webhook trigger
  },
  async run(context: TriggerContext<StaticPropsValue>) {
    return [context.payload];
  },
});
