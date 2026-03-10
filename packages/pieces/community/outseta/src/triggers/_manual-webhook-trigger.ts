import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';

type ManualWebhookTriggerArgs = {
  name: string;
  displayName: string;
  description: string;
  sampleData?: Record<string, unknown>;
};

export function createManualWebhookTrigger(args: ManualWebhookTriggerArgs) {
  return createTrigger({
    name: args.name,
    auth: outsetaAuth,
    displayName: args.displayName,
    description: `${args.description}`,
    type: TriggerStrategy.WEBHOOK,
    props: {
      instruction: Property.MarkDown({
        value : `**Setup:** In Outseta go to Settings → Notifications → Add Notification, select the matching activity type, and paste this trigger's webhook URL {{webhookUrl}} as the callback URL.`
      })
    }, 
    sampleData: args.sampleData ?? {},
    async onEnable() {
      // Manual setup required in Outseta UI (Settings → Notifications)
    },
    async onDisable() {
      // Manual cleanup in Outseta UI if needed
    },
    async run(context) {
      return [context.payload.body];
    },
  });
}
