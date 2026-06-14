import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { respondIoAuth } from '../common/auth';

export const newOutgoingMessageTrigger = createTrigger({
  name: 'new_outgoing_message',
  displayName: 'New Outgoing Message',
  description: 'Triggers when a message is sent from Respond.io.',
  aiMetadata: {
    description: 'Fires when a message is sent out from Respond.io to a contact (by an agent, automation, or API), delivering the message and its contact. Use to react to outbound messages; for messages received from contacts use the New Incoming Message trigger. Requires manually configuring a message.sent webhook in Respond.io.',
  },
  auth: respondIoAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
			To use this trigger, you need to manually set up a webhook in your Respond.io account:

			1. Login to your Respond.io account.
			2. Go to Settings > Integrations > Webhooks.
			3. Click on "Add Webhook" or "Create New Webhook".
			4. Add the following URL in the **Webhook URL** field:
			\`\`\`text
			{{webhookUrl}}
			\`\`\`
			5. Select **message.sent** from the event types.
			6. Click Save to create the webhook.
			`,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: undefined,
  async onEnable(context) {
    // No need to register webhooks programmatically as user will do it manually
  },
  async onDisable(context) {
    // No need to unregister webhooks as user will do it manually
  },

  async run(context) {
    return [context.payload.body];
  },
});
