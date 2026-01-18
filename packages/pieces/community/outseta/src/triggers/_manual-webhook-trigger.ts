import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';

type ManualWebhookTriggerArgs = {
  name: string;
  displayName: string;
  description: string;
  sampleData?: Record<string, unknown>;
};

export function createManualWebhookTrigger(args: ManualWebhookTriggerArgs) {
  return createTrigger({
    name: args.name,
    displayName: args.displayName,
    description: args.description,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: args.sampleData ?? {},
    async onEnable() {
      // Manual setup in Outseta UI (Settings → Notifications)
    },
    async onDisable() {
      // Manual cleanup in Outseta UI if needed
    },
    async run(context) {
      return [
        {
          rawPayload: context.payload.body,
          headers: context.payload.headers,
          queryParams: context.payload.queryParams,
          receivedAt: new Date().toISOString(),
        },
      ];
    },
  });
}
