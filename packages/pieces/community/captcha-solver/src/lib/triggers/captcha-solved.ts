import { createTrigger, StaticPropsValue, TriggerContext, TriggerStrategy } from "@activepieces/pieces-framework";

export const captchaSolvedTrigger = createTrigger({
  name: "captcha_solved",
  displayName: "CAPTCHA Solved (Webhook)",
  description: "Triggers whenever a CAPTCHA solution is received via callback.",
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    id: "123456789",
    code: "SOLUTION_TOKEN_ABC_123",
  },
  async onEnable(context: TriggerContext<StaticPropsValue>) {
    // Webhook-only trigger, nothing to register with third-party service
  },
  async onDisable(context: TriggerContext<StaticPropsValue>) {
    // Nothing to unregister
  },
  async run(context: TriggerContext<StaticPropsValue>) {
    const payload: any = context.payload;
    
    // Normalize different service payloads (2Captcha, CapSolver, etc.)
    const taskId = payload.id || payload.taskId || payload.jobId || "unknown";
    const solution = payload.code || (payload.solution ? (payload.solution.token || payload.solution.gRecaptchaResponse) : undefined) || payload.token;

    return [{
      taskId,
      solution,
      receivedAt: new Date().toISOString(),
      rawPayload: payload,
    }];
  },
});
