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
  description:
    'Triggers when Telnyx delivers a message.received webhook event.',
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
    event_type: 'message.received',
    id: 'b301ed3f-1490-491f-995f-6e64e69674d4',
    occurred_at: '2024-01-15T20:16:07.588+00:00',
    payload: {
      completed_at: null,
      cost: { amount: '0.0000', currency: 'USD' },
      direction: 'inbound',
      encoding: 'GSM-7',
      errors: [],
      from: {
        carrier: 'T-Mobile USA',
        line_type: 'long_code',
        phone_number: '+13125550001',
      },
      id: '84cca175-9755-4859-b67f-4730d7f58aa3',
      media: [],
      messaging_profile_id: '740572b6-099c-44a1-89b9-6c92163bc68d',
      organization_id: '47a530f8-4362-4526-829b-bcee17fd9f7a',
      parts: 1,
      received_at: '2024-01-15T20:16:07.503+00:00',
      record_type: 'message',
      sent_at: null,
      tags: [],
      text: 'Hello from Telnyx!',
      to: [
        {
          carrier: 'Telnyx',
          line_type: 'Wireless',
          phone_number: '+17735550002',
          status: 'webhook_delivered',
        },
      ],
      type: 'SMS',
      valid_until: null,
      webhook_failover_url: null,
      webhook_url: 'https://example.com/webhooks',
    },
    record_type: 'event',
  },
  async onEnable() {
    // Manual webhook setup in Telnyx portal.
  },
  async onDisable() {
    // Manual webhook setup in Telnyx portal.
  },
  async run(context) {
    const body = context.payload.body as { data?: { event_type?: string } };
    if (body?.data?.event_type !== 'message.received') {
      return [];
    }
    return [body.data];
  },
});
