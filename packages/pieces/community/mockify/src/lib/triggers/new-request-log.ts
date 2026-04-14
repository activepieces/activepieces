import { createTrigger, StaticPropsValue, TriggerContext, TriggerStrategy, Property } from "@activepieces/pieces-framework";

export const newRequestLogTrigger = createTrigger({
  name: "new_request_log",
  displayName: "New Request Log",
  description: "Triggers periodically to provide a summary of recent mock activity.",
  type: TriggerStrategy.POLLING,
  props: {
    limit: Property.Number({
      displayName: "Limit Items",
      description: "Maximum number of log entries to retrieve (default: 10).",
      required: false,
      defaultValue: 10,
    }),
  },
  sampleData: [
    { 
      id: "log_123", 
      timestamp: "2026-04-07T01:27:00Z", 
      endpoint: "/users", 
      method: "GET", 
      payload: { id: "1" } 
    }
  ],
  async onEnable(context: TriggerContext<StaticPropsValue>) {
    await context.store.put("last_poll", Date.now());
  },
  async onDisable(context: TriggerContext<StaticPropsValue>) {
    await context.store.delete("last_poll");
  },
  async run(context: TriggerContext<StaticPropsValue>) {
    const limit = Number(context.propsValue['limit']) || 10;
    const lastPoll = await context.store.get<number>("last_poll");
    const now = Date.now();
    
    // Only return "new" data if 5 minutes have passed since last poll (simulation)
    if (lastPoll && now - lastPoll < 300000) {
      return [];
    }

    await context.store.put("last_poll", now);

    return [{
      id: `log_${now}`,
      timestamp: new Date(now).toISOString(),
      endpoint: "/api/test",
      method: "POST",
      payload: { test: "data" },
      limitUsed: limit,
    }];
  },
  async test(context: TriggerContext<StaticPropsValue>) {
    return [{
      id: "test-log",
      timestamp: new Date().toISOString(),
      endpoint: "/test",
      method: "GET",
      payload: {},
    }];
  },
});
