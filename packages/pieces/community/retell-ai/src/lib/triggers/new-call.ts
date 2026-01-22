import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

import { retellAiAuth } from '../common/auth';

export const newCallTrigger = createTrigger({
  name: 'new_call',
  displayName: 'New Call',
  description: 'Triggers when a new outgoing or incoming call is created.',
  auth: retellAiAuth,
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
      To use this trigger, you need to manually set up a webhook in your Retell AI account:

      1. Login to your Retell AI dashboard.
      2. Navigate to the Webhooks section in your settings.
      3. Click on "Add Webhook" or "Create New Webhook".
      4. Add the following URL in the **Webhook URL** field:
      \`\`\`text
      {{webhookUrl}}
      \`\`\`
      5. Select the **call.created** event type.
      6. Click Save to create the webhook.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    call_id: "119c3f8e47135a29e65947eeb34cf12d",
    status: "initiated",
    from_number: "+15551234567",
    to_number: "+15557654321",
    direction: "outbound",
    agent_id: "ag_01h9pc3e7jnb2rvnj5jkxgf5d4",
    created_at: "2023-09-15T14:30:00.000Z",
    metadata: {
      custom_field: "value"
    }
  },

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