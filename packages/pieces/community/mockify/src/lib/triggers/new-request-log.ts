import { createTrigger, StaticPropsValue, TriggerContext, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { createHash } from "crypto";

export const newRequestLogTrigger = createTrigger({
  name: "new_request_log",
  displayName: "New Request Log",
  description: "Triggers periodically based on the provided mock data. Emits events when the mock data array changes.",
  type: TriggerStrategy.POLLING,
  props: {
    mockData: Property.Json({
      displayName: "Mock Events (Array)",
      description: "An array of mock event objects. New events are triggered whenever this array changes.",
      required: true,
      defaultValue: [
        { id: "log_1", endpoint: "/users", method: "GET" }
      ],
    }),
  },
  sampleData: {},
  async onEnable(context: TriggerContext<StaticPropsValue>) {
    await context.store.put("last_hash", "");
  },
  async onDisable(context: TriggerContext<StaticPropsValue>) {
    await context.store.delete("last_hash");
  },
  async run(context: TriggerContext<StaticPropsValue>) {
    const data = context.propsValue['mockData'] as any;
    const items = Array.isArray(data) ? data : [];
    if (items.length === 0) return [];
    
    // Deduplication mechanism based on the hash of the payload
    const currentHash = createHash("md5").update(JSON.stringify(items)).digest("hex");
    const lastHash = await context.store.get<string>("last_hash");

    if (currentHash === lastHash) {
      return [];
    }
    
    await context.store.put("last_hash", currentHash);
    return items;
  },
  async test(context: TriggerContext<StaticPropsValue>) {
    const data = context.propsValue['mockData'] as any;
    return Array.isArray(data) ? data : [];
  },
});
