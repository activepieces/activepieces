import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';

type ManualWebhookTriggerArgs = {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  sampleData?: Record<string, unknown>;
};

export function createManualWebhookTrigger(args: ManualWebhookTriggerArgs) {
  return createTrigger({
    name: args.name,
    auth: outsetaAuth,
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
      const body = context.payload.body as Record<string, unknown>;
      const eventType = body?.['EventType'] as string | undefined;

      if (eventType && eventType !== args.eventType) {
        return [];
      }

      return [body];
    },
  });
}
