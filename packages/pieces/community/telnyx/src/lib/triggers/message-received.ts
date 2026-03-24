import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { telnyxAuth } from '../auth';

export const messageReceivedTrigger = createTrigger({
  auth: telnyxAuth,
  name: 'message_received',
  displayName: 'Message Received',
  description: 'Triggers when Telnyx delivers a message.received webhook event.',
  props: {
    webhook_instructions: Property.MarkDown({
      value: `
To use this trigger, configure your Telnyx messaging webhook manually:

1. Open your Telnyx portal.
2. Go to the messaging profile or inbound messaging configuration you use for SMS.
3. Set the webhook URL to:

\`\`\`text
{{webhookUrl}}
\`\`\`

4. Make sure webhook API version is **v2**.
5. Enable or send **message.received** events to this webhook URL.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    id: 'evt_123',
    event_type: 'message.received',
    occurred_at: '2026-03-24T20:15:00Z',
    record_type: 'event',
    payload: {
      id: '182bd5e5-6e1a-4fe4-a799-aa6d9a6ab26e',
      direction: 'inbound',
      record_type: 'message',
      received_at: '2026-03-24T20:14:59Z',
      text: 'Hello from Telnyx',
      type: 'SMS',
      from: {
        phone_number: '+15550001111',
      },
      to: [
        {
          phone_number: '+15550002222',
          status: 'received',
        },
      ],
    },
  },
  async onEnable() {
    // Manual webhook setup in Telnyx portal.
  },
  async onDisable() {
    // Manual webhook setup in Telnyx portal.
  },
  async run(context) {
    const body = context.payload.body as { event_type?: string };
    if (body?.event_type !== 'message.received') {
      return [];
    }
    return [body];
  },
});
