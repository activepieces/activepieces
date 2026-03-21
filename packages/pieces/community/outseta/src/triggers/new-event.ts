import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';

export const newEventTrigger = createTrigger({
  name: 'new_event',
  auth: outsetaAuth,
  displayName: 'New Event',
  description:
    'Triggers when any event occurs in Outseta. Configure the webhook URL in Outseta under Settings → Notifications.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    EventType: 'account.created',
    Data: {
      Uid: 'abc123',
      Name: 'Example',
    },
  },
  async onEnable() {
    // Webhook must be configured manually in Outseta (Settings → Notifications)
  },
  async onDisable() {
    // Webhook must be removed manually in Outseta
  },
  async run(context) {
    return [context.payload.body as Record<string, unknown>];
  },
});
