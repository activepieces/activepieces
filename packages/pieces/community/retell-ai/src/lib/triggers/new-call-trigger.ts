import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { retellAiAuth } from '../..';

export const newCallTrigger = createTrigger({
  auth: retellAiAuth,
  name: 'new_call_fires',
  displayName: 'New Call Event',
  description: 'Fires when a call event (e.g., call started, ended) occurs in Retell AI.',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
      To enable this trigger, connect your Retell AI agent with a webhook endpoint:

        Sign in to your Retell AI Dashboard
        .

        Open the Agents section and select the agent you want to track.

        In the agent’s Settings, locate the Webhook URL field.

        Paste the following endpoint into the field:

        {{webhookUrl}}


        Save your changes.

        Once configured, Retell AI will automatically send call lifecycle events (such as call_started and call_ended) to this webhook. Your flow can then react dynamically to these events, and you can add filtering logic if you only want to handle specific event types.
        `,
        }),
    },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    "event": "call_started",
    "call": {
      "call_id": "Jabr9TXYYJHfvl6Syypi88rdAHYHmcq6",
      "call_type": "phone_call",
      "from_number": "+12137771234",
      "to_number": "+12137771235",
      "direction": "outbound",
      "agent_id": "oBeDLoLOeuAbiuaMFXRtDOLriTJ5tSxD",
      "agent_version": 1,
      "call_status": "ongoing",
      "start_timestamp": 1703302407333
    }
  },

  async onEnable(context) {
    // Webhook is registered manually by the user.
  },

  async onDisable(context) {
    // Webhook is removed manually by the user.
  },

  async run(context) {
    // The webhook payload from Retell is wrapped in a 'call' object and includes an 'event' type.
    // We return the entire body to the user for maximum flexibility.
    return [context.payload.body];
  },
});
